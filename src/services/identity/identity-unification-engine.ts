import stringSimilarity from "string-similarity";
import { authorService } from "@/services/author-service";
import type { IntentClassification, IdentityMatchResult } from "@/types/ai";
import type { ContactIdentity } from "@/types/domain";
import { normalizeEmail, normalizeInstagram, normalizePhone } from "@/lib/security/sanitize";

export class IdentityUnificationEngine {
  async match(input: {
    identity: ContactIdentity;
    classification: IntentClassification;
  }): Promise<IdentityMatchResult> {
    const candidates = await authorService.findCandidates({
      identity: input.identity,
      authorName: input.classification.entities.author_name,
      bookTitle: input.classification.entities.book_title,
    });

    if (candidates.length === 0) {
      return {
        status: "NO_MATCH",
        confidence: 0,
        reasons: ["No author profile matched the supplied channel identity or extracted entities."],
        candidateAuthorIds: [],
      };
    }

    const scored = candidates
      .map((author) => ({
        author,
        confidence: scoreAuthor(author, input.identity, input.classification),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const [best, second] = scored;
    const candidateAuthorIds = scored.map(({ author }) => author.id);

    if (second && best.confidence - second.confidence < 0.12) {
      return {
        status: "MULTIPLE_MATCHES",
        confidence: best.confidence,
        reasons: ["Multiple author profiles have similar identity confidence."],
        candidateAuthorIds,
      };
    }

    if (best.confidence < 0.7) {
      return {
        status: "NEEDS_REVIEW",
        confidence: best.confidence,
        authorId: best.author.id,
        reasons: ["Best identity match is below the safe auto-merge threshold."],
        candidateAuthorIds,
      };
    }

    return {
      status: "MATCHED",
      confidence: Math.min(0.99, best.confidence),
      authorId: best.author.id,
      reasons: ["Author identity matched using normalized channel identity and extracted entities."],
      candidateAuthorIds,
    };
  }
}

function scoreAuthor(
  author: Awaited<ReturnType<typeof authorService.findCandidates>>[number],
  identity: ContactIdentity,
  classification: IntentClassification,
) {
  let score = 0;
  const signals = 0.0001;

  if (identity.email && normalizeEmail(author.email ?? undefined) === normalizeEmail(identity.email)) {
    score += 0.45;
  }

  if (identity.phone && normalizePhone(author.phone ?? undefined) === normalizePhone(identity.phone)) {
    score += 0.35;
  }

  if (
    identity.instagramHandle &&
    normalizeInstagram(author.instagramHandle ?? undefined) === normalizeInstagram(identity.instagramHandle)
  ) {
    score += 0.4;
  }

  if (identity.dashboardUserId && author.dashboardUserId === identity.dashboardUserId) {
    score += 0.45;
  }

  const displayName = identity.displayName ?? classification.entities.author_name;
  if (displayName) {
    score +=
      stringSimilarity.compareTwoStrings(displayName.toLowerCase(), author.fullName.toLowerCase()) * 0.2;
  }

  if (classification.entities.book_title) {
    const title = classification.entities.book_title.toLowerCase();
    const titleScore = Math.max(
      ...author.books.map((book) =>
        stringSimilarity.compareTwoStrings(title, book.title.toLowerCase()),
      ),
      0,
    );
    score += titleScore * 0.25;
  }

  if (!identity.email && !identity.phone && !identity.instagramHandle && !identity.dashboardUserId) {
    score *= 0.85;
  }

  return Math.min(0.99, Math.max(signals, score));
}

export const identityUnificationEngine = new IdentityUnificationEngine();
