import { prisma } from "@waas/database";
import crypto from "node:crypto";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import { campaignSchedulerQueue } from "../../queue/queues/message.queue";
import { campaignsService } from "./campaigns.service";
import type {
  CreateCampaignTemplateInput,
  UpdateCampaignTemplateInput
} from "./campaign-template.schema";

export class CampaignTemplateService {
  async list(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    return prisma.campaignTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        runs: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
  }

  async get(templateId: string, userId: string) {
    const template = await prisma.campaignTemplate.findUnique({
      where: { id: templateId },
      include: {
        runs: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!template) {
      throw new AppError("Campaign template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    await workspacesService.assertMembership(template.workspaceId, userId);
    return template;
  }

  async create(input: CreateCampaignTemplateInput, userId: string) {
    if (userId !== "SYSTEM") {
      await workspacesService.assertMembership(input.workspaceId, userId);
    }

    const instance = await prisma.instance.findFirst({
      where: { id: input.instanceId, workspaceId: input.workspaceId }
    });
    if (!instance) {
      throw new AppError("WhatsApp instance not found in this workspace", 404, "INSTANCE_NOT_FOUND");
    }

    const template = await prisma.campaignTemplate.create({
      data: {
        publicId: `tpl_${crypto.randomBytes(12).toString("hex")}`,
        workspaceId: input.workspaceId,
        instanceId: input.instanceId,
        name: input.name,
        notes: input.notes || null,
        messageTemplate: input.messageTemplate,
        audienceType: input.audienceType,
        audienceGroupName: input.audienceGroupName || null,
        audienceTags: input.audienceTags || [],
        isActive: input.isActive,
        cronExpression: input.cronExpression,
        timezone: input.timezone,
        minDelaySeconds: input.minDelaySeconds,
        maxDelaySeconds: input.maxDelaySeconds,
        maxPerMinute: input.maxPerMinute,
        footerEnabled: input.footerEnabled
      }
    });

    if (template.isActive) {
      await this.registerRepeatingJob(template);
    }

    return template;
  }

  async update(templateId: string, input: UpdateCampaignTemplateInput, userId: string) {
    const template = await prisma.campaignTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new AppError("Campaign template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    await workspacesService.assertMembership(template.workspaceId, userId);

    const updated = await prisma.campaignTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        notes: input.notes,
        messageTemplate: input.messageTemplate,
        audienceType: input.audienceType,
        audienceGroupName: input.audienceGroupName,
        audienceTags: input.audienceTags,
        isActive: input.isActive,
        cronExpression: input.cronExpression,
        timezone: input.timezone,
        minDelaySeconds: input.minDelaySeconds,
        maxDelaySeconds: input.maxDelaySeconds,
        maxPerMinute: input.maxPerMinute,
        footerEnabled: input.footerEnabled
      }
    });

    // Remove old scheduler job registration
    await this.removeRepeatingJob(templateId);

    // Re-register if still active
    if (updated.isActive) {
      await this.registerRepeatingJob(updated);
    }

    return updated;
  }

  async delete(templateId: string, userId: string) {
    const template = await prisma.campaignTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new AppError("Campaign template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    await workspacesService.assertMembership(template.workspaceId, userId);

    // Remove from scheduler queue
    await this.removeRepeatingJob(templateId);

    await prisma.campaignTemplate.delete({ where: { id: templateId } });
    return { id: templateId, deleted: true };
  }

  /**
   * Spawns a new Campaign run from a template schedule trigger.
   * This is executed by the system worker, hence userId is bypassed.
   */
  async scheduleNextRun(templateId: string) {
    const template = await prisma.campaignTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template || !template.isActive) return;

    const timestamp = new Date().toLocaleString("en-US", { timeZone: template.timezone });
    const runName = `${template.name} - Run [${timestamp}]`;

    // Create execution Campaign record
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: template.workspaceId,
        instanceId: template.instanceId,
        templateId: template.id,
        name: runName,
        notes: `Recurring schedule trigger for: ${template.name}`,
        messageTemplate: template.messageTemplate,
        audienceType: template.audienceType,
        audienceGroupName: template.audienceGroupName,
        audienceTags: template.audienceTags,
        status: "DRAFT",
        isRecurring: true,
        cronExpression: template.cronExpression,
        minDelaySeconds: template.minDelaySeconds,
        maxDelaySeconds: template.maxDelaySeconds,
        maxPerMinute: template.maxPerMinute,
        footerEnabled: template.footerEnabled
      }
    });

    // Dispatch the spawned campaign run immediately as SYSTEM
    await campaignsService.dispatch(campaign.id, "SYSTEM");
  }

  private async registerRepeatingJob(template: any) {
    await campaignSchedulerQueue.add(
      `template-${template.id}`,
      { templateId: template.id },
      {
        repeat: {
          pattern: template.cronExpression,
          tz: template.timezone
        },
        jobId: `template-${template.id}`
      }
    );
  }

  private async removeRepeatingJob(templateId: string) {
    try {
      const repeatable = await campaignSchedulerQueue.getRepeatableJobs();
      const existing = repeatable.find((j) => j.id === `template-${templateId}`);
      if (existing) {
        await campaignSchedulerQueue.removeRepeatableByKey(existing.key);
      }
    } catch (err) {
      console.error(`Failed to remove repeatable job for template ${templateId}`, err);
    }
  }
}

export const campaignTemplateService = new CampaignTemplateService();
