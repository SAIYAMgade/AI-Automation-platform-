import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import { env, runtimeFlags } from "@/lib/env";
import { AppError } from "@/lib/errors";

const redis = runtimeFlags.hasRedis
  ? new Redis(env.REDIS_URL!, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "bookleaf_rate_limit",
      points: env.RATE_LIMIT_POINTS,
      duration: env.RATE_LIMIT_DURATION_SECONDS,
    })
  : new RateLimiterMemory({
      points: env.RATE_LIMIT_POINTS,
      duration: env.RATE_LIMIT_DURATION_SECONDS,
    });

export async function enforceRateLimit(key: string) {
  try {
    await limiter.consume(key);
  } catch {
    throw new AppError("Rate limit exceeded. Please retry shortly.", 429, "RATE_LIMITED");
  }
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
