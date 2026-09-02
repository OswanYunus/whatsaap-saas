import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export const MESSAGE_QUEUE_NAME = "message-send";
export const CAMPAIGN_SCHEDULER_QUEUE_NAME = "campaign-scheduler";
const INSTANCE_SEND_SAFETY_PREFIX = "waas:instance-send-next-at:";

export interface MessageJobData {
  messageId: string;
  instanceId: string;
  to: string;
  content: string;
  campaignId?: string;
  contactId?: string;
  variables?: Record<string, string>;
}

export interface CampaignSchedulerJobData {
  templateId?: string;
  campaignId?: string;
}

/**
 * Queue that individual message sends are pushed onto.
 */
export const messageQueue = new Queue<MessageJobData>(MESSAGE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

export async function reserveInstanceSendDelay(instanceId: string, requestedDelayMs = 0) {
  const now = Date.now();
  const desiredAt = now + Math.max(0, requestedDelayMs);
  const gapMs = Number(process.env.WHATSAPP_SEND_GAP_MS || 10000);
  const ttlMs = 24 * 60 * 60 * 1000;
  const key = `${INSTANCE_SEND_SAFETY_PREFIX}${instanceId}`;
  const script = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    local desired = tonumber(ARGV[1])
    local gap = tonumber(ARGV[2])
    local ttl = tonumber(ARGV[3])
    local scheduled = desired
    if current > desired then
      scheduled = current
    end
    redis.call("SET", KEYS[1], scheduled + gap, "PX", ttl)
    return scheduled
  `;
  const scheduledAt = await redisConnection.eval(script, 1, key, desiredAt, gapMs, ttlMs);
  return Math.max(0, Number(scheduledAt) - now);
}

/**
 * Queue that manages recurring/scheduled campaign template triggers.
 */
export const campaignSchedulerQueue = new Queue<CampaignSchedulerJobData>(
  CAMPAIGN_SCHEDULER_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000
    }
  }
);
