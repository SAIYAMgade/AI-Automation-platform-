import request from "supertest";
import { createExpressApp } from "@/server/express-app";

describe("BookLeaf API", () => {
  const app = createExpressApp();

  it("automates a supported chat request", async () => {
    const response = await request(app)
      .post("/api/chat")
      .send({
        query: "When will my royalty arrive for Dreams of Fire?",
        channel: "DASHBOARD",
        identity: {
          email: "sara.johnson@gmail.com",
          displayName: "Sara Johnson",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.intent).toBe("ROYALTY_STATUS");
    expect(response.body.data.requiresHuman).toBe(false);
  });

  it("creates escalation tickets through the API", async () => {
    const response = await request(app)
      .post("/api/escalate")
      .send({
        reason: "Manual verification requested by staff.",
        priority: "HIGH",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("OPEN");
  });
});
