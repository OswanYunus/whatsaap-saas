import { Worker } from "bullmq";
import { redisConnection } from "../connection";
import { MESSAGE_QUEUE_NAME, type MessageJobData } from "../queues/message.queue";
import { logger } from "../../utils/logger";
import { whatsappService } from "../../modules/whatsapp/whatsapp.service";
import { prisma } from "@waas/database";

/**
 * Standalone worker process (run separately from the API via
 * `pnpm dev:worker`). Consumes jobs pushed onto the message queue and
 * hands them to WhatsAppService. Until WhatsAppService.sendMessage is
 * implemented, jobs will fail and be retried/backed-off per the
 * queue's defaultJobOptions — that's expected at this scaffolding stage.
 */
const worker = new Worker<MessageJobData>(
  MESSAGE_QUEUE_NAME,
  async (job) => {
    const { messageId, instanceId, to, content } = job.data;

    const result = await whatsappService.sendMessage(instanceId, to, content);

    await prisma.message.update({
  where: { id: messageId },
  data: {
    status: result.status,
    ...(result.status === "SENT" && {
      sentAt: new Date()
    })
  }
});

    return result;
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Message job completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Message job failed");
});

logger.info("Message worker started, waiting for jobs...");