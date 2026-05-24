import express from "express";
import cors from "cors";
import helmet from "helmet";
import { chatRequestSchema, escalationRequestSchema, ingestRequestSchema } from "@/types/api";
import { queryOrchestrator } from "@/services/query-orchestrator";
import { escalationService } from "@/services/escalation-service";
import { ragIngestionService } from "@/rag/ingest-service";
import { conversationService } from "@/services/conversation-service";
import { analyticsService } from "@/services/analytics-service";

export function createExpressApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/chat", async (req, res, next) => {
    try {
      const body = chatRequestSchema.parse({ ...req.body, stream: false });
      const result = await queryOrchestrator.handle(body);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/escalate", async (req, res, next) => {
    try {
      const body = escalationRequestSchema.parse(req.body);
      const result = await escalationService.create(body);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ingest-documents", async (req, res, next) => {
    try {
      const body = ingestRequestSchema.parse({ ...req.body, async: false });
      const result = await ragIngestionService.ingestDocuments(body.documents);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/conversations", async (_req, res, next) => {
    try {
      const result = await conversationService.listConversations();
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics", async (_req, res, next) => {
    try {
      const result = await analyticsService.getOverview();
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    res.status(500).json({
      ok: false,
      error: {
        code: "EXPRESS_ADAPTER_ERROR",
        message: error instanceof Error ? error.message : "Unexpected Express adapter error",
      },
    });
  });

  return app;
}
