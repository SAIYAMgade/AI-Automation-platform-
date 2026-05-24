import { intentEngine } from "@/ai/intent-engine";

describe("IntentEngine", () => {
  it("classifies royalty queries with extracted book context", async () => {
    const result = await intentEngine.classify("When will my royalty arrive for Dreams of Fire?");

    expect(result.intent).toBe("ROYALTY_STATUS");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("escalates unclear requests", async () => {
    const result = await intentEngine.classify("Can someone check this thing?");

    expect(result.intent).toBe("UNKNOWN");
    expect(result.requires_human).toBe(true);
  });

  it("routes FAQ questions into knowledge base intent", async () => {
    const result = await intentEngine.classify("Can I use a pen name in the 21-Day Writing Challenge?");

    expect(result.intent).toBe("KNOWLEDGE_BASE");
    expect(result.requires_human).toBe(false);
  });
});
