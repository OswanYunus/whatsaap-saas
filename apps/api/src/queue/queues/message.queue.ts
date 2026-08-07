import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export const MESSAGE_QUEUE_NAME = "message-send";
export const CAMPAIGN_SCHEDULER_QUEUE_NAME = "campaign-scheduler";

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
