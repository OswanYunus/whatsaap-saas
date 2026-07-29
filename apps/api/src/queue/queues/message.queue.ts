import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export const MESSAGE_QUEUE_NAME = "message-send";

export interface MessageJobData {
  messageId: string;
  instanceId: string;
  to: string;
  content: string;
}

/**
 * Queue that campaign sends are pushed onto. A route/service enqueues
 * one job per contact rather than sending synchronously, so that:
 *   - Sending thousands of messages doesn't block the HTTP request.
 *   - We get built-in retry/backoff for transient WhatsApp/network errors.
 *   - Send rate can be throttled per instance to respect WhatsApp limits.
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