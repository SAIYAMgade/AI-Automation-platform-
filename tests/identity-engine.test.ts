import { identityUnificationEngine } from "@/services/identity/identity-unification-engine";

describe("IdentityUnificationEngine", () => {
  it("matches authors across normalized channel identity", async () => {
    const result = await identityUnificationEngine.match({
      identity: {
        instagramHandle: "@sarapoetry23",
        displayName: "Sara J.",
      },
      classification: {
        intent: "ROYALTY_STATUS",
        confidence: 0.92,
        entities: { book_title: "Dreams of Fire" },
        ambiguity: { is_ambiguous: false, reasons: [] },
        requires_human: false,
      },
    });

    expect(result.status).toBe("MATCHED");
    expect(result.authorId).toBe("3e2b5344-0a38-4a0b-a656-4d09f89a1001");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });
});
