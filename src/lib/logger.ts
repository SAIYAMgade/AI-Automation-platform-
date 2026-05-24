import pino from "pino";
import { env } from "@/lib/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: {
    service: "bookleaf-ai-platform",
    env: env.NODE_ENV,
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENAI_API_KEY",
      "*.email",
      "*.phone",
    ],
    remove: true,
  },
});

export type AppLogger = typeof logger;
