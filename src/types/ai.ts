import type { QueryIntent } from "@/types/domain";

export type IntentClassification = {
  intent: QueryIntent;
  confidence: number;
  entities: {
    book_title?: string;
    author_name?: string;
    email?: string;
    phone?: string;
    instagram_handle?: string;
    timeframe?: string;
    add_on_service?: string;
  };
  ambiguity: {
    is_ambiguous: boolean;
    reasons: string[];
  };
  requires_human: boolean;
  escalation_reason?: string;
};

export type IdentityMatchResult = {
  status: "MATCHED" | "MULTIPLE_MATCHES" | "NO_MATCH" | "NEEDS_REVIEW";
  confidence: number;
  authorId?: string;
  reasons: string[];
  candidateAuthorIds: string[];
};

export type GroundingContext = {
  author?: {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    instagramHandle?: string | null;
  };
  books: Array<{
    id: string;
    title: string;
    status: string;
    isbn?: string | null;
    royaltyStatus: string;
    royaltyAmountDue?: string | number | null;
    royaltyPayoutDate?: string | Date | null;
    authorCopyStatus: string;
    authorCopyTracking?: string | null;
    prPackageStatus: string;
    dashboardStatus: string;
    salesReportUrl?: string | null;
    bookLiveDate?: string | Date | null;
    finalSubmissionDate?: string | Date | null;
    addOnServices?: Record<string, unknown>;
  }>;
  retrievedKnowledge: Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    similarity: number;
  }>;
};

export type GeneratedAnswer = {
  text: string;
  confidence: number;
  groundedFacts: string[];
};
