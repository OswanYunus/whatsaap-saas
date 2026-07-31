import { Worker } from "bullmq";
import { redisConnection } from "../connection";
import {
  MESSAGE_QUEUE_NAME,
  CAMPAIGN_SCHEDULER_QUEUE_NAME,
  type MessageJobData,
  type CampaignSchedulerJobData
} from "../queues/message.queue";
import { logger } from "../../utils/logger";
import { whatsappService } from "../../modules/whatsapp/whatsapp.service";
import { prisma } from "@waas/database";
import { renderTemplate } from "../../lib/template-engine";
import { campaignTemplateService } from "../../modules/campaigns/campaign-template.service";

/**
 * Message send worker — consumes individual message jobs from the queue.
 * Applies template variable substitution before sending, then updates
 * the Message record with the final status and failureReason if applicable.
 * After settling, it re-evaluates the parent campaign's overall status.
 */
const messageWorker = new Worker<MessageJobData>(
  MESSAGE_QUEUE_NAME,
  async (job) => {
    const { messageId, instanceId, to, content, campaignId, variables = {} } = job.data;

    // Mark as SENDING
    await prisma.message.update({
      where: { id: messageId },
      data: { status: "SENDING" }
    });

    // Build footer text if enabled
    let body = content;
    if (variables.footerEnabled === "true" && variables.softwareName) {
      const footer = `\n\n_Sent via ${variables.softwareName} on behalf of ${variables.workspaceName || "your business"}._`;
      body = content + footer;
    }

    // Apply template variable substitution
    body = renderTemplate(body, variables);

    let result: { status: "SENT" | "FAILED"; error?: string };

    try {
      const sendResult = await whatsappService.sendMessage(instanceId, to, body);
      result = { status: sendResult.status as "SENT" | "FAILED" };
    } catch (err: any) {
      result = { status: "FAILED", error: err?.message || String(err) };
    }

    // Update message record
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: result.status,
        ...(result.status === "SENT" ? { sentAt: new Date() } : {}),
        ...(result.status === "FAILED" ? { failureReason: result.error || "Unknown error" } : {})
      }
    });

    // Recompute campaign status if this belongs to a campaign
    if (campaignId) {
      await recomputeCampaignStatus(campaignId);
    }

    return result;
  },
  { connection: redisConnection, concurrency: 5 }
);

/**
 * Campaign scheduler worker — fires recurring campaign template executions.
 */
const campaignSchedulerWorker = new Worker<CampaignSchedulerJobData>(
  CAMPAIGN_SCHEDULER_QUEUE_NAME,
  async (job) => {
    const { templateId } = job.data;
    logger.info({ templateId }, "Triggering scheduled campaign template run");
    await campaignTemplateService.scheduleNextRun(templateId);
  },
  { connection: redisConnection, concurrency: 2 }
);

/**
 * Recomputes a campaign's overall status based on its current message statuses.
 * Called after each message settles (SENT, FAILED, DELIVERED, etc.)
 */
async function recomputeCampaignStatus(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      messages: { select: { status: true } }
    }
  });

  if (!campaign || campaign.status === "CANCELLED" || campaign.status === "PAUSED") return;

  const messages = campaign.messages;
  if (messages.length === 0) return;

  const terminal = ["SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"];
  const allSettled = messages.every((m) => terminal.includes(m.status));

  if (allSettled) {
    const allFailed = messages.every((m) => m.status === "FAILED" || m.status === "CANCELLED");
    const newStatus = allFailed ? "FAILED" : "COMPLETED";

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: newStatus,
        completedAt: new Date()
      }
    });

    logger.info({ campaignId, status: newStatus }, "Campaign completed");
  }
}

messageWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Message job completed");
});

messageWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Message job failed");
});

campaignSchedulerWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Campaign scheduler job completed");
});

campaignSchedulerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Campaign scheduler job failed");
});

logger.info("Message worker and campaign scheduler started, waiting for jobs...");