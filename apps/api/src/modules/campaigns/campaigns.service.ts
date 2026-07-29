import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import type { CreateCampaignInput, UpdateCampaignStatusInput } from "./campaigns.schema";

/**
 * Valid manual status transitions triggered from the UI's
 * Pause/Resume buttons. COMPLETED/FAILED are reached automatically
 * once every message resolves (see recomputeStatusIfFinished), not
 * set directly by a user action — but the update endpoint still
 * accepts them for admin/debugging use.
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  RUNNING: ["PAUSED", "COMPLETED", "FAILED"],
  PAUSED: ["RUNNING", "COMPLETED", "FAILED"],
  SCHEDULED: ["RUNNING", "PAUSED"],
  DRAFT: ["RUNNING"]
};

export class CampaignsService {
  async list(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: { select: { status: true } }
      }
    });

    return campaigns.map((c) => this.serialize(c));
  }

  async create(input: CreateCampaignInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    const instance = await prisma.instance.findFirst({
      where: { id: input.instanceId, workspaceId: input.workspaceId }
    });
    if (!instance) {
      throw new AppError("WhatsApp instance not found in this workspace", 404, "INSTANCE_NOT_FOUND");
    }

    const contacts = input.groupName
      ? await prisma.contact.findMany({
          where: { workspaceId: input.workspaceId, groupName: input.groupName }
        })
      : await prisma.contact.findMany({
          where: { workspaceId: input.workspaceId, id: { in: input.contactIds } }
        });

    if (contacts.length === 0) {
      throw new AppError("No matching contacts found for this campaign", 400, "NO_RECIPIENTS");
    }

    // Campaign + one Message per recipient are created together.
    // Messages start QUEUED; actually dispatching them to WhatsApp is
    // the job of the queue worker + WhatsAppService, wired up in a
    // later phase. Creating a campaign here means "start sending" —
    // there's no separate draft/schedule step in the current UI.
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: input.workspaceId,
        instanceId: input.instanceId,
        name: input.name,
        messageTemplate: input.messageTemplate,
        status: "RUNNING",
        messages: {
          create: contacts.map((contact) => ({
            instanceId: input.instanceId,
            contactId: contact.id,
            to: contact.phone,
            body: input.messageTemplate,
            status: "QUEUED"
          }))
        }
      },
      include: {
        _count: { select: { messages: true } },
        messages: { select: { status: true } }
      }
    });

    return this.serialize(campaign);
  }

  async updateStatus(campaignId: string, input: UpdateCampaignStatusInput, userId: string) {
    const campaign = await this.findOwned(campaignId, userId);

    const allowedNext = ALLOWED_TRANSITIONS[campaign.status] ?? [];
    if (!allowedNext.includes(input.status)) {
      throw new AppError(
        `Cannot move campaign from ${campaign.status} to ${input.status}`,
        409,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: input.status },
      include: {
        _count: { select: { messages: true } },
        messages: { select: { status: true } }
      }
    });

    return this.serialize(updated);
  }

  async delete(campaignId: string, userId: string) {
    const campaign = await this.findOwned(campaignId, userId);
    // Messages created by this campaign are kept (campaignId is set to
    // null via the schema's onDelete: SetNull) so delivery history
    // isn't silently erased when a campaign is removed.
    await prisma.campaign.delete({ where: { id: campaign.id } });
    return { id: campaign.id, deleted: true };
  }

  private async findOwned(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");
    }
    await workspacesService.assertMembership(campaign.workspaceId, userId);
    return campaign;
  }

  private serialize(campaign: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    _count: { messages: number };
    messages: { status: string }[];
  }) {
    const total = campaign._count.messages;
    const sent = campaign.messages.filter((m) => ["SENT", "DELIVERED", "READ"].includes(m.status)).length;
    const progress = total === 0 ? 0 : Math.round((sent / total) * 100);

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      recipients: total,
      progress
    };
  }
}

export const campaignsService = new CampaignsService();