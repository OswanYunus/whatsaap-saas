import { prisma } from "@waas/database";
import { workspacesService } from "../workspaces/workspaces.service";
import type { ListMessagesQuery } from "./messages.schema";

const QUEUE_STATUSES = ["QUEUED", "SENT", "DELIVERED", "READ", "FAILED"] as const;

export class MessagesService {
  /**
   * Message rows don't carry a workspaceId directly — only
   * instanceId — so every query here filters through the related
   * Instance to enforce the workspace boundary.
   */
  async list(query: ListMessagesQuery, userId: string) {
    await workspacesService.assertMembership(query.workspaceId, userId);

    const where = {
      instance: { workspaceId: query.workspaceId },
      ...(query.campaignId ? { campaignId: query.campaignId } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          campaign: { select: { id: true, name: true } }
        }
      })
    ]);

    return {
      messages,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize))
      }
    };
  }

  /** Backs the Queue Monitor board: counts of messages by status. */
  async queueSummary(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const counts = await prisma.message.groupBy({
      by: ["status"],
      where: { instance: { workspaceId } },
      _count: { _all: true }
    });

    const summary = Object.fromEntries(QUEUE_STATUSES.map((s) => [s, 0])) as Record<
      (typeof QUEUE_STATUSES)[number],
      number
    >;
    for (const row of counts) {
      summary[row.status as (typeof QUEUE_STATUSES)[number]] = row._count._all;
    }

    return summary;
  }

  /** Backs the Dashboard's "recent activity" style feeds. */
  async recent(workspaceId: string, userId: string, limit = 10) {
    await workspacesService.assertMembership(workspaceId, userId);

    return prisma.message.findMany({
      where: { instance: { workspaceId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        contact: { select: { name: true, phone: true } },
        campaign: { select: { name: true } }
      }
    });
  }
}

export const messagesService = new MessagesService();