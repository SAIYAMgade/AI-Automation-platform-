import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "@/ai/clients";
import { GROUNDED_RESPONSE_SYSTEM_PROMPT } from "@/ai/prompts";
import type { GeneratedAnswer, GroundingContext, IntentClassification } from "@/types/ai";
import { formatDate } from "@/utils/format";
import { logger } from "@/lib/logger";

export class ResponseGenerator {
  async generate(input: {
    query: string;
    classification: IntentClassification;
    context: GroundingContext;
  }): Promise<GeneratedAnswer> {
    const model = createChatModel({ temperature: 0 });

    if (!model) {
      return this.fallbackAnswer(input);
    }

    try {
      const response = await model.invoke([
        new SystemMessage(GROUNDED_RESPONSE_SYSTEM_PROMPT),
        new HumanMessage(
          JSON.stringify(
            {
              author_query: input.query,
              intent: input.classification.intent,
              structured_database_facts: input.context,
            },
            null,
            2,
          ),
        ),
      ]);

      return {
        text: String(response.content),
        confidence: Math.min(0.98, input.classification.confidence),
        groundedFacts: extractGroundedFacts(input.context),
      };
    } catch (error) {
      logger.warn({ error }, "OpenAI response generation failed; using grounded fallback");
      return this.fallbackAnswer(input);
    }
  }

  private fallbackAnswer(input: {
    classification: IntentClassification;
    context: GroundingContext;
  }): GeneratedAnswer {
    const { classification, context } = input;
    const book = chooseBook(context, classification.entities.book_title);
    const authorName = context.author?.fullName ?? "there";
    let text: string;

    switch (classification.intent) {
      case "ROYALTY_STATUS":
        text = book
          ? `Hi ${authorName}, I found ${book.title}. Its royalty status is ${humanize(book.royaltyStatus)}${
              book.royaltyPayoutDate ? `, with the next payout date listed as ${formatDate(book.royaltyPayoutDate)}` : ""
            }${
              book.royaltyAmountDue ? `. The amount currently marked as due is Rs. ${book.royaltyAmountDue}` : ""
            }.`
          : "I could not verify the royalty record from the available account data.";
        break;
      case "AUTHOR_COPY":
        text = book
          ? `Hi ${authorName}, your author copy status for ${book.title} is ${humanize(book.authorCopyStatus)}${
              book.authorCopyTracking ? `. Tracking ID: ${book.authorCopyTracking}` : ""
            }.`
          : "I could not verify the author copy record from the available account data.";
        break;
      case "ISBN_STATUS":
        text = book
          ? book.isbn
            ? `Hi ${authorName}, the ISBN for ${book.title} is ${book.isbn}.`
            : `Hi ${authorName}, ${book.title} does not have an ISBN recorded yet. This usually means metadata validation or proof approval is still pending.`
          : "I could not verify the ISBN record from the available account data.";
        break;
      case "ADDON_STATUS":
        text = book
          ? `Hi ${authorName}, the PR package for ${book.title} is currently ${humanize(book.prPackageStatus)}.`
          : "I could not verify the add-on service record from the available account data.";
        break;
      case "SALES_REPORT":
        text = book?.salesReportUrl
          ? `Hi ${authorName}, the sales report for ${book.title} is available at ${book.salesReportUrl}.`
          : "I could not find an available sales report link for this book yet.";
        break;
      case "TIMELINE_QUERY":
        text = book
          ? `Hi ${authorName}, ${book.title} is currently ${humanize(book.status)}. Final submission was recorded as ${
              book.finalSubmissionDate ? formatDate(book.finalSubmissionDate) : "not available"
            }${
              book.bookLiveDate ? ` and the live date is ${formatDate(book.bookLiveDate)}` : ""
            }.`
          : context.retrievedKnowledge[0]?.content ??
            "BookLeaf publishing timelines are usually based on final manuscript submission, proof approval, ISBN assignment, listing, and live publication milestones.";
        break;
      case "DASHBOARD_ACCESS":
        text = book
          ? `Hi ${authorName}, the dashboard status on your account is ${humanize(book.dashboardStatus)}.`
          : "I could not verify the dashboard account from the available identity details.";
        break;
      case "COMPANY_INFO":
      case "KNOWLEDGE_BASE":
        text =
          context.retrievedKnowledge.length > 0
            ? context.retrievedKnowledge
                .slice(0, 2)
                .map((chunk) => chunk.content)
                .join(" ")
            : "BookLeaf supports authors through publishing, ISBN, listing, royalty, fulfillment, and optional PR workflows. Exact account-specific pricing or invoice details should be verified by support.";
        break;
      case "BOOK_STATUS":
        text = book
          ? `Hi ${authorName}, ${book.title} is currently marked as ${humanize(book.status)}${
              book.bookLiveDate ? ` and went live on ${formatDate(book.bookLiveDate)}` : ""
            }.`
          : "I could not confidently identify the book record for this request.";
        break;
      default:
        text = "I could not confidently verify your request. A human support specialist has been notified.";
        break;
    }

    if (!book && requiresBookRecord(classification.intent)) {
      text += " A human support specialist should verify the account before sending a final answer.";
    }

    return {
      text,
      confidence: Math.min(0.92, classification.confidence),
      groundedFacts: extractGroundedFacts(context),
    };
  }
}

function chooseBook(context: GroundingContext, bookTitle?: string) {
  if (!bookTitle) return context.books[0];
  const normalized = bookTitle.toLowerCase();
  return context.books.find((book) => book.title.toLowerCase().includes(normalized)) ?? context.books[0];
}

function extractGroundedFacts(context: GroundingContext) {
  return [
    ...context.books.flatMap((book) => [
      `${book.title}: status=${book.status}`,
      `${book.title}: royalty=${book.royaltyStatus}`,
      book.isbn ? `${book.title}: isbn=${book.isbn}` : "",
    ]),
    ...context.retrievedKnowledge.map((chunk) => `${chunk.title}: ${chunk.category}`),
  ].filter(Boolean);
}

function humanize(value?: string | null) {
  return value ? value.replace(/_/g, " ").toLowerCase() : "not available";
}

function requiresBookRecord(intent: string) {
  return !["UNKNOWN", "COMPANY_INFO", "KNOWLEDGE_BASE"].includes(intent);
}

export const responseGenerator = new ResponseGenerator();
