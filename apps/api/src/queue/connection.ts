import IORedis from "ioredis";
import { env } from "@waas/config";

/**
 * Shared ioredis connection used by BullMQ queues and workers.
 * `maxRetriesPerRequest: null` is required by BullMQ so it can manage
 * its own retry/backoff behavior for blocking commands.
 */
export const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});