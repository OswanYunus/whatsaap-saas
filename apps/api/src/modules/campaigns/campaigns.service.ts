import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import { messageQueue } from "../../queue/queues/message.queue";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  AudiencePreviewQuery
} from "./campaigns.schema";

export class CampaignsService {
  async list(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    return campaigns.map((c) => this.serializeCampaign(c));
  }

  async get(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }

    await workspacesService.assertMembership(campaign.workspaceId, userId);
    return this.serializeCampaign(campaign);
  }

  async audiencePreview(query: AudiencePreviewQuery, userId: string) {
    await workspacesService.assertMembership(query.workspaceId, userId);
    const contacts = await this.resolveAudience(query.workspaceId, {
      audienceType: query.audienceType,
      audienceGroupName: query.audienceGroupName,
      audienceTags: query.audienceTags,
      contactIds: query.contactIds
    });

    const sampleNames = contacts.slice(0, 5).map((c) => c.fullName);
    
    // Validate number formats
    let invalidCount = 0;
    let duplicatesCount = 0;
    const seenNumbers = new Set<string>();

    for (const c of contacts) {
      const clean = c.phoneNumber.replace(/\D/g, "");
      if (clean.length < 8 || clean.length > 15) {
        invalidCount++;
      }
      if (seenNumbers.has(clean)) {
        duplicatesCount++;
      } else {
        seenNumbers.add(clean);
      }
    }

    return {
      total: contacts.length,
      sampleNames,
      invalidCount,
      duplicatesCount
    };
  }

  async create(input: CreateCampaignInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    const instance = await prisma.instance.findFirst({
      where: { id: input.instanceId, workspaceId: input.workspaceId }
    });
    if (!instance) {
      throw new AppError("WhatsApp instance not found in this workspace", 404, "INSTANCE_NOT_FOUND");
    }

    const status = input.scheduledAt ? "SCHEDULED" : "DRAFT";

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: input.workspaceId,
        instanceId: input.instanceId,
        name: input.name,
        notes: input.notes || null,
        messageTemplate: input.messageTemplate,
        audienceType: input.audienceType,
        audienceGroupName: input.audienceGroupName || null,
        audienceTags: input.audienceTags || [],
        status,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        timezone: input.timezone || null,
        isRecurring: input.isRecurring,
        cronExpression: input.cronExpression || null,
        minDelaySeconds: input.minDelaySeconds,
        maxDelaySeconds: input.maxDelaySeconds,
        maxPerMinute: input.maxPerMinute,
        footerEnabled: input.footerEnabled
      },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    return this.serializeCampaign(campaign);
  }

  async update(campaignId: string, input: UpdateCampaignInput, userId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }

    await workspacesService.assertMembership(campaign.workspaceId, userId);

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      throw new AppError("Only draft or scheduled campaigns can be edited", 400, "INVALID_STATE");
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: input.name,
        notes: input.notes,
        messageTemplate: input.messageTemplate,
        audienceType: input.audienceType,
        audienceGroupName: input.audienceGroupName,
        audienceTags: input.audienceTags,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        timezone: input.timezone,
        isRecurring: input.isRecurring,
        cronExpression: input.cronExpression,
        minDelaySeconds: input.minDelaySeconds,
        maxDelaySeconds: input.maxDelaySeconds,
        maxPerMinute: input.maxPerMinute,
        footerEnabled: input.footerEnabled
      },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    return this.serializeCampaign(updated);
  }

  async updateStatus(campaignId: string, status: "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED", userId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }

    await workspacesService.assertMembership(campaign.workspaceId, userId);

    // If resuming from paused
    if (status === "RUNNING" && campaign.status === "PAUSED") {
      // Re-enqueue all QUEUED messages
      const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "RUNNING" }
      });
      await this.enqueueQueuedMessages(campaignId);
      return this.serializeCampaign(updated);
    }

    // Standard status update
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status,
        ...(status === "CANCELLED" ? { completedAt: new Date() } : {})
      },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    return this.serializeCampaign(updated);
  }

  async delete(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }

    await workspacesService.assertMembership(campaign.workspaceId, userId);

    if (campaign.status !== "DRAFT" && campaign.status !== "CANCELLED" && campaign.status !== "COMPLETED" && campaign.status !== "FAILED") {
      throw new AppError("Campaign cannot be deleted in its current state", 400, "INVALID_STATE");
    }

    await prisma.campaign.delete({ where: { id: campaignId } });
    return { id: campaignId, deleted: true };
  }

  async dispatch(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { workspace: true }
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }

    if (userId !== "SYSTEM") {
      await workspacesService.assertMembership(campaign.workspaceId, userId);
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      throw new AppError("Campaign has already been dispatched", 400, "ALREADY_DISPATCHED");
    }



    // Resolve audience
    const contacts = await this.resolveAudience(campaign.workspaceId, campaign);

    if (contacts.length === 0) {
      throw new AppError("No contacts found in selected audience", 400, "NO_RECIPIENTS");
    }

    // Update campaign to RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING", startedAt: new Date() }
    });

    // Create Message records
    const messagesData = contacts.map((c) => ({
      instanceId: campaign.instanceId,
      campaignId,
      contactId: c.id,
      to: c.phoneNumber,
      body: campaign.messageTemplate,
      status: "QUEUED" as const
    }));

    await prisma.message.createMany({
      data: messagesData
    });

    // Enqueue in BullMQ with staggered delays
    await this.enqueueQueuedMessages(campaignId);

    const updated = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          select: { status: true, updatedAt: true }
        }
      }
    });

    return this.serializeCampaign(updated!);
  }

  async getAnalytics(campaignId: string, userId: string) {
    const campaign = await this.get(campaignId, userId);
    return campaign;
  }

  /**
   * Staggered queue helper to add all QUEUED messages of a campaign onto BullMQ.
   */
  private async enqueueQueuedMessages(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { workspace: true }
    });
    if (!campaign) return;

    const queuedMessages = await prisma.message.findMany({
      where: { campaignId, status: "QUEUED" },
      include: { contact: { select: { fullName: true, phoneNumber: true } } }
    });

    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId: campaign.workspaceId }
    });
    const softwareName = settings?.softwareName || "Cerebro";
    const workspaceName = campaign.workspace.name;
    const appendFooter = campaign.footerEnabled && (settings?.footerEnabled !== false);

    let currentDelay = 0;
    for (const msg of queuedMessages) {
      // Safety sending settings delay
      const delay = Math.floor(Math.random() * (campaign.maxDelaySeconds - campaign.minDelaySeconds + 1)) + campaign.minDelaySeconds;
      currentDelay += delay;

      await messageQueue.add(
        "send-message",
        {
          messageId: msg.id,
          instanceId: campaign.instanceId,
          to: msg.to,
          content: campaign.messageTemplate,
          campaignId,
          contactId: msg.contactId || undefined,
          variables: {
            name: msg.contact?.fullName || "",
            phone: msg.contact?.phoneNumber || "",
            softwareName,
            workspaceName,
            footerEnabled: appendFooter ? "true" : "false"
          }
        },
        {
          delay: currentDelay * 1000
        }
      );
    }
  }

  private async resolveAudience(workspaceId: string, filter: {
    audienceType: "ALL" | "GROUP" | "TAGS" | "MANUAL";
    audienceGroupName?: string | null;
    audienceTags?: string[];
    contactIds?: string[];
  }) {
    const where: any = {
      workspaceId,
      status: "ACTIVE"
    };

    if (filter.audienceType === "GROUP" && filter.audienceGroupName) {
      where.groupName = filter.audienceGroupName;
    } else if (filter.audienceType === "TAGS" && filter.audienceTags && filter.audienceTags.length > 0) {
      where.tags = { hasSome: filter.audienceTags };
    } else if (filter.audienceType === "MANUAL" && filter.contactIds && filter.contactIds.length > 0) {
      where.id = { in: filter.contactIds };
    }

    return prisma.contact.findMany({ where });
  }

  private serializeCampaign(campaign: any) {
    const messages = campaign.messages || [];
    const total = messages.length;
    const queued = messages.filter((m: any) => m.status === "QUEUED").length;
    const sending = messages.filter((m: any) => m.status === "SENDING").length;
    const sent = messages.filter((m: any) => m.status === "SENT").length;
    const delivered = messages.filter((m: any) => m.status === "DELIVERED").length;
    const read = messages.filter((m: any) => m.status === "READ").length;
    const failed = messages.filter((m: any) => m.status === "FAILED").length;
    const cancelled = messages.filter((m: any) => m.status === "CANCELLED").length;
    const retrying = messages.filter((m: any) => m.status === "RETRYING").length;

    const completed = sent + delivered + read + failed + cancelled;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const sentMessages = messages
      .filter((m: any) => ["SENT", "DELIVERED", "READ"].includes(m.status))
      .sort((a: any, b: any) => a.updatedAt.getTime() - b.updatedAt.getTime());

    let avgSendRateMsgPerSec = 0;
    let estimatedRemainingSeconds = 0;

    if (sentMessages.length >= 2) {
      const durationMs = sentMessages[sentMessages.length - 1].updatedAt.getTime() - sentMessages[0].updatedAt.getTime();
      const count = sentMessages.length - 1;
      if (durationMs > 0) {
        avgSendRateMsgPerSec = count / (durationMs / 1000);
      }
    }

    if (avgSendRateMsgPerSec > 0) {
      const remainingCount = total - completed;
      estimatedRemainingSeconds = Math.round(remainingCount / avgSendRateMsgPerSec);
    } else {
      const avgDelay = (campaign.minDelaySeconds + campaign.maxDelaySeconds) / 2;
      const remainingCount = total - completed;
      estimatedRemainingSeconds = remainingCount * avgDelay;
    }

    return {
      id: campaign.id,
      name: campaign.name,
      notes: campaign.notes,
      instanceId: campaign.instanceId,
      messageTemplate: campaign.messageTemplate,
      status: campaign.status,
      audienceType: campaign.audienceType,
      audienceGroupName: campaign.audienceGroupName,
      audienceTags: campaign.audienceTags,
      scheduledAt: campaign.scheduledAt,
      timezone: campaign.timezone,
      isRecurring: campaign.isRecurring,
      cronExpression: campaign.cronExpression,
      minDelaySeconds: campaign.minDelaySeconds,
      maxDelaySeconds: campaign.maxDelaySeconds,
      maxPerMinute: campaign.maxPerMinute,
      footerEnabled: campaign.footerEnabled,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      analytics: {
        total,
        queued,
        sending,
        sent,
        delivered,
        read,
        failed,
        cancelled,
        retrying,
        progress,
        avgSendRateMsgPerSec,
        estimatedRemainingSeconds
      }
    };
  }
}

export const campaignsService = new CampaignsService();