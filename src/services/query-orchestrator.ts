import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sanitizeUserText } from "@/lib/security/sanitize";
import { intentEngine } from "@/ai/intent-engine";
import { responseGenerator } from "@/ai/response-generator";
import { retrievalService } from "@/rag/retrieval-service";
import { identityUnificationEngine } from "@/services/identity/identity-unification-engine";
import { authorService } from "@/services/author-service";
import { conversationService } from "@/services/conversation-service";
import { escalationService } from "@/services/escalation-service";
import { supportLogService } from "@/services/support-log-service";
import type { ChatRequest } from "@/types/api";
import type { GroundingContext } from "@/types/ai";
import type { AuthorRecord } from "@/types/domain";
import type { ChatAutomationResult } from "@/types/orchestrator";

export class QueryOrchestrator {
  async handle(request: ChatRequest): Promise<ChatAutomationResult> {
    const startedAt = Date.now();
    const requestId = randomUUID();
    const query = sanitizeUserText(request.query);

    const classification = await intentEngine.classify(query);
    const identity = await identityUnificationEngine.match({
      identity: {
        ...request.identity,
        email: request.identity.email ?? classification.entities.email,
        phone: request.identity.phone ?? classification.entities.phone,
        instagramHandle: request.identity.instagramHandle ?? classification.entities.instagram_handle,
      },
      classification,
    });

    const author = identity.authorId ? await authorService.getAuthor(identity.authorId) : null;
    const retrievedDocuments = await retrievalService.retrieve(query, 5);
    const escalationReason = determineEscalationReason(
      classification,
      identity.status,
      author,
      retrievedDocuments.length,
    );
    const requiresHuman = escalationReason !== null;

    const conversation = await conversationService.upsertConversation({
      conversationId: request.conversationId,
      authorId: author?.id,
      authorName: author?.fullName,
      channel: request.channel,
      externalThreadId: request.externalThreadId,
      message: query,
      intent: classification.intent,
      confidence: classification.confidence,
      escalated: requiresHuman,
    });

    await conversationService.addMessage({
      conversationId: conversation.id,
      role: "USER",
      content: query,
      intent: classification.intent,
      aiConfidence: classification.confidence,
      metadata: request.metadata,
    });

    let response: string;
    let escalation:
      | {
          id: string;
          reason: string;
          priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        }
      | undefined;

    if (escalationReason) {
      const priority = escalationReason.includes("Multiple") ? "HIGH" : "MEDIUM";
      const ticket = await escalationService.create({
        conversationId: conversation.id,
        authorId: author?.id,
        reason: escalationReason,
        priority,
        payload: {
          requestId,
          query,
          classification,
          identity,
          candidateAuthorIds: identity.candidateAuthorIds,
          retrievedDocumentIds: retrievedDocuments.map((document) => document.id),
        },
      });

      escalation = {
        id: ticket.id,
        reason: escalationReason,
        priority,
      };
      response = "We could not confidently verify your request. A human support specialist has been notified.";
    } else {
      const answer = await responseGenerator.generate({
        query,
        classification,
        context: toGroundingContext(author, retrievedDocuments),
      });
      response = answer.text;
    }

    await conversationService.addMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: response,
      intent: classification.intent,
      aiConfidence: classification.confidence,
      metadata: {
        requiresHuman,
        escalationId: escalation?.id,
        retrievedDocumentIds: retrievedDocuments.map((document) => document.id),
      },
    });

    const latencyMs = Date.now() - startedAt;

    await supportLogService.record({
      requestId,
      conversationId: conversation.id,
      authorId: author?.id,
      channel: request.channel,
      userQuery: query,
      aiResponse: response,
      intent: classification.intent,
      confidence: classification.confidence,
      retrievedDocumentIds: retrievedDocuments.map((document) => document.id),
      latencyMs,
      failureReason: escalationReason ?? undefined,
      requiresHuman,
      metadata: {
        identity,
        modelConfidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
      },
    });

    logger.info(
      {
        requestId,
        channel: request.channel,
        intent: classification.intent,
        confidence: classification.confidence,
        requiresHuman,
        latencyMs,
      },
      "BookLeaf query automated",
    );

    return {
      requestId,
      conversationId: conversation.id,
      response,
      intent: classification.intent,
      confidence: classification.confidence,
      requiresHuman,
      escalation,
      author: author ? { id: author.id, name: author.fullName } : undefined,
      identity,
      classification,
      retrievedDocuments,
      latencyMs,
      channel: request.channel,
    };
  }
}

function determineEscalationReason(
  classification: Awaited<ReturnType<typeof intentEngine.classify>>,
  identityStatus: string,
  author: AuthorRecord | null,
  retrievedDocumentCount: number,
) {
  if (classification.confidence < env.AI_CONFIDENCE_THRESHOLD) {
    return classification.escalation_reason ?? "AI confidence is below the automation threshold.";
  }

  if (classification.intent === "UNKNOWN" || classification.requires_human) {
    return classification.escalation_reason ?? "The query intent is unclear or outside supported automation paths.";
  }

  if (requiresKnowledgeBase(classification.intent) && retrievedDocumentCount === 0) {
    return "No sufficiently relevant BookLeaf knowledge-base content was found.";
  }

  if (!requiresAuthorIdentity(classification.intent)) {
    return null;
  }

  if (identityStatus === "MULTIPLE_MATCHES") {
    return "Multiple author matches found for the supplied identity.";
  }

  if (identityStatus === "NO_MATCH") {
    return "No author profile matched the supplied identity.";
  }

  if (identityStatus === "NEEDS_REVIEW") {
    return "Author identity match requires manual review.";
  }

  if (!author) {
    return "Author record could not be loaded.";
  }

  if (author.books.length > 1 && !classification.entities.book_title) {
    return "Multiple books exist for this author and no book title was supplied.";
  }

  const book = author.books[0];
  if (classification.intent === "ISBN_STATUS" && book.status === "LIVE" && !book.isbn) {
    return "Database inconsistency: live book is missing ISBN.";
  }

  if (classification.intent === "ROYALTY_STATUS" && book.royaltyStatus === "PROCESSING" && !book.royaltyPayoutDate) {
    return "Database inconsistency: royalty is processing but payout date is missing.";
  }

  return null;
}

function requiresKnowledgeBase(intent: string) {
  return ["COMPANY_INFO", "KNOWLEDGE_BASE"].includes(intent);
}

function requiresAuthorIdentity(intent: string) {
  return !["COMPANY_INFO", "KNOWLEDGE_BASE", "UNKNOWN"].includes(intent);
}

function toGroundingContext(
  author: AuthorRecord | null,
  retrievedKnowledge: Awaited<ReturnType<typeof retrievalService.retrieve>>,
): GroundingContext {
  return {
    author: author
      ? {
          id: author.id,
          fullName: author.fullName,
          email: author.email,
          phone: author.phone,
          instagramHandle: author.instagramHandle,
        }
      : undefined,
    books: author?.books ?? [],
    retrievedKnowledge,
  };
}

export const queryOrchestrator = new QueryOrchestrator();
