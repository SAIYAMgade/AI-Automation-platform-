import Redis from "ioredis";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";

type CacheEntry = {
  expiresAt: number;
  value: string;
};

class CacheService {
  private readonly memory = new Map<string, CacheEntry>();
  private readonly redis = runtimeFlags.hasRedis
    ? new Redis(env.REDIS_URL!, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      })
    : null;

  async getJson<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        return value ? (JSON.parse(value) as T) : null;
      }

      const entry = this.memory.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        this.memory.delete(key);
        return null;
      }

      return JSON.parse(entry.value) as T;
    } catch (error) {
      logger.warn({ error, key }, "Cache read failed");
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number) {
    try {
      const serialized = JSON.stringify(value);
      if (this.redis) {
        await this.redis.set(key, serialized, "EX", ttlSeconds);
        return;
      }

      this.memory.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (error) {
      logger.warn({ error, key }, "Cache write failed");
    }
  }

  async del(key: string) {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.memory.delete(key);
  }
}

export const cache = new CacheService();
