import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "@/ai/clients";
import { INTENT_SYSTEM_PROMPT } from "@/ai/prompts";
import type { IntentClassification } from "@/types/ai";
import { QUERY_INTENTS, type QueryIntent } from "@/types/domain";
import { logger } from "@/lib/logger";

const classificationSchema = z.object({
  intent: z.enum(QUERY_INTENTS),
  confidence: z.number().min(0).max(1),
  entities: z
    .object({
      book_title: z.string().optional(),
      author_name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      instagram_handle: z.string().optional(),
      timeframe: z.string().optional(),
      add_on_service: z.string().optional(),
    })
    .default({}),
  ambiguity: z.object({
    is_ambiguous: z.boolean(),
    reasons: z.array(z.string()).default([]),
  }),
  requires_human: z.boolean(),
  escalation_reason: z.string().optional(),
});

const intentKeywords: Array<[QueryIntent, RegExp[]]> = [
  ["ROYALTY_STATUS", [/royalt/i, /payout/i, /payment/i, /earning/i, /amount/i]],
  ["AUTHOR_COPY", [/author copy/i, /copy/i, /courier/i, /tracking/i, /dispatch/i, /shipment/i]],
  ["ISBN_STATUS", [/\bisbn\b/i]],
  ["ADDON_STATUS", [/pr package/i, /add[-\s]?on/i, /marketing/i, /cover design/i, /editing/i]],
  ["SALES_REPORT", [/sales report/i, /sales/i, /statement/i]],
  ["COMPANY_INFO", [/bookleaf/i, /company/i, /cost/i, /price/i, /package/i, /plan/i, /service/i]],
  [
    "KNOWLEDGE_BASE",
    [
      /21[-\s]?day/i,
      /challenge/i,
      /genuine/i,
      /pen name/i,
      /refund/i,
      /upgrade/i,
      /login details/i,
      /forgot.*password/i,
      /reset.*password/i,
      /didn.?t receive.*login/i,
      /poem/i,
      /hindi/i,
      /save.*progress/i,
      /rearrange/i,
      /finali[sz]/i,
      /cover/i,
      /template/i,
      /back cover/i,
      /profile photo/i,
      /copyright/i,
      /rights/i,
      /portal/i,
      /technical/i,
      /submit.*email/i,
    ],
  ],
  ["TIMELINE_QUERY", [/timeline/i, /how long/i, /when.*live/i, /when.*publish/i, /book.*publish/i, /process/i]],
  ["DASHBOARD_ACCESS", [/dashboard/i, /login/i, /password/i, /access/i]],
  ["BOOK_STATUS", [/book live/i, /status/i, /live yet/i, /published/i]],
];

export class IntentEngine {
  async classify(query: string): Promise<IntentClassification> {
    const model = createChatModel({ temperature: 0 });

    if (!model) {
      return this.fallbackClassify(query);
    }

    try {
      const structuredModel = model.withStructuredOutput(classificationSchema, {
        name: "BookLeafIntentClassification",
      });

      const response = await structuredModel.invoke([
        new SystemMessage(INTENT_SYSTEM_PROMPT),
        new HumanMessage(query),
      ]);

      return classificationSchema.parse(response);
    } catch (error) {
      logger.warn({ error }, "OpenAI intent classification failed; using fallback classifier");
      return this.fallbackClassify(query);
    }
  }

  private fallbackClassify(query: string): IntentClassification {
    const lower = query.toLowerCase();
    let intent: QueryIntent = "UNKNOWN";
    let confidence = 0.42;

    for (const [candidate, patterns] of intentKeywords) {
      if (patterns.some((pattern) => pattern.test(query))) {
        intent = candidate;
        confidence = candidate === "BOOK_STATUS" && lower.includes("status") ? 0.78 : 0.86;
        break;
      }
    }

    const bookTitle = extractBookTitle(query);
    const email = query.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const phone = query.match(/(?:\+?91[-\s]?)?[6-9]\d{9}/)?.[0];
    const instagram = query.match(/@[a-z0-9._]{2,30}/i)?.[0];
    const ambiguousStatus =
      intent === "BOOK_STATUS" && !bookTitle && !email && !phone && !instagram && lower.includes("status");

    if (ambiguousStatus) {
      confidence = Math.min(confidence, 0.72);
    }

    return {
      intent,
      confidence,
      entities: {
        book_title: bookTitle,
        email,
        phone,
        instagram_handle: instagram,
        add_on_service: lower.includes("pr") ? "pr_package" : undefined,
      },
      ambiguity: {
        is_ambiguous: ambiguousStatus || intent === "UNKNOWN",
        reasons:
          intent === "UNKNOWN"
            ? ["No supported BookLeaf support intent could be confidently detected."]
            : ambiguousStatus
              ? ["The author asked for status without identifying a book or account."]
              : [],
      },
      requires_human: confidence < 0.8 || intent === "UNKNOWN",
      escalation_reason:
        confidence < 0.8 || intent === "UNKNOWN"
          ? "Intent confidence is below the automation threshold."
          : undefined,
    };
  }
}

function extractBookTitle(query: string) {
  const quoted = query.match(/["“']([^"”']{2,100})["”']/);
  if (quoted?.[1]) return quoted[1].trim();

  const titled = query.match(/(?:for|about|book)\s+([A-Z][A-Za-z0-9\s:'-]{2,80})/);
  if (!titled?.[1]) return undefined;

  return titled[1].replace(/[?.!,]$/, "").trim();
}

export const intentEngine = new IntentEngine();
