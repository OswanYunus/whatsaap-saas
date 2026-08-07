import crypto from "node:crypto";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { messageQueue, campaignSchedulerQueue } from "../../queue/queues/message.queue";
import { campaignsService } from "../campaigns/campaigns.service";
import { campaignTemplateService } from "../campaigns/campaign-template.service";
import type {
  DeveloperCreateCampaignInput,
  DeveloperScheduleMessageInput,
  DeveloperSendMessageInput
} from "./developer-api.schema";

export class DeveloperApiService {
  async sendMessage(workspaceId: string, input: DeveloperSendMessageInput) {
    return this.createMessageJob(workspaceId, input);
  }

  async scheduleMessage(workspaceId: string, input: DeveloperScheduleMessageInput) {
    const scheduledAt = new Date(input.scheduledAt);
    const delay = scheduledAt.getTime() - Date.now();
    if (delay <= 0) {
      throw new AppError("scheduledAt must be in the future", 400, "INVALID_SCHEDULE");
    }

    return this.createMessageJob(workspaceId, input, delay, scheduledAt);
  }

  async getMessageStatus(workspaceId: string, publicId: string) {
    const message = await prisma.message.findFirst({
      where: {
        publicId,
        instance: { workspaceId }
      },
      select: {
        publicId: true,
        to: true,
        status: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true
      }
    });

    if (!message) {
      throw new AppError("Message not found", 404, "MESSAGE_NOT_FOUND");
    }

    return {
      id: message.publicId,
      recipient: message.to,
      status: message.status,
      failureReason: message.failureReason,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sentAt: message.sentAt
    };
  }

  async createCampaign(workspaceId: string, input: DeveloperCreateCampaignInput) {
    const instance = await this.resolveInstance(workspaceId, input.instanceId);
    const audience = input.audience ?? { type: "ALL" as const };

    if (input.recurring) {
      const template = await campaignTemplateService.create({
        workspaceId,
        instanceId: instance.id,
        name: input.name,
        messageTemplate: input.message,
        audienceType: audience.type,
        audienceGroupName: audience.groupName,
        audienceTags: audience.tags ?? [],
        isActive: true,
        cronExpression: input.recurring.cronExpression,
        timezone: input.recurring.timezone,
        minDelaySeconds: input.minDelaySeconds,
        maxDelaySeconds: input.maxDelaySeconds,
        maxPerMinute: input.maxPerMinute,
        footerEnabled: input.footerEnabled
      }, "SYSTEM");

      return {
        id: template.publicId,
        type: "recurring",
        status: template.isActive ? "SCHEDULED" : "DRAFT",
        createdAt: template.createdAt
      };
    }

    const campaign = await campaignsService.create({
      workspaceId,
      instanceId: instance.id,
      name: input.name,
      messageTemplate: input.message,
      audienceType: audience.type,
      audienceGroupName: audience.groupName,
      audienceTags: audience.tags ?? [],
      contactIds: audience.contactIds,
      scheduledAt: input.scheduledAt,
      timezone: null,
      isRecurring: false,
      cronExpression: null,
      minDelaySeconds: input.minDelaySeconds,
      maxDelaySeconds: input.maxDelaySeconds,
      maxPerMinute: input.maxPerMinute,
      footerEnabled: input.footerEnabled
    }, "SYSTEM");

    if (input.scheduledAt) {
      await campaignSchedulerQueue.add(
        "dispatch-campaign",
        { campaignId: campaign.id },
        { delay: Math.max(0, new Date(input.scheduledAt).getTime() - Date.now()) }
      );
    } else {
      await campaignsService.dispatch(campaign.id, "SYSTEM");
    }

    return {
      id: campaign.publicId,
      type: "campaign",
      status: input.scheduledAt ? "SCHEDULED" : "RUNNING",
      createdAt: campaign.createdAt
    };
  }

  private async createMessageJob(
    workspaceId: string,
    input: DeveloperSendMessageInput,
    delay = 0,
    scheduledAt?: Date
  ) {
    const instance = await this.resolveInstance(workspaceId, input.instanceId);
    const publicId = `msg_${crypto.randomBytes(12).toString("hex")}`;

    const message = await prisma.message.create({
      data: {
        publicId,
        instanceId: instance.id,
        to: input.recipient,
        body: input.message,
        status: "QUEUED"
      }
    });

    await messageQueue.add(
      "send-message",
      {
        messageId: message.id,
        instanceId: instance.id,
        to: input.recipient,
        content: input.message
      },
      delay > 0 ? { delay } : undefined
    );

    return {
      id: publicId,
      status: "QUEUED",
      recipient: input.recipient,
      scheduledAt
    };
  }

  private async resolveInstance(workspaceId: string, instanceId?: string) {
    const where = instanceId
      ? { id: instanceId, workspaceId, status: "CONNECTED" as const }
      : { workspaceId, status: "CONNECTED" as const };

    const instance = await prisma.instance.findFirst({ where });
    if (!instance) {
      throw new AppError("No connected WhatsApp instance found in this workspace", 503, "NO_CONNECTED_INSTANCE");
    }

    return instance;
  }
}

export const developerApiService = new DeveloperApiService();
