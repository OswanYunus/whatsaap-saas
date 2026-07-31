import { prisma } from "@waas/database";
import { workspacesService } from "../workspaces/workspaces.service";

export class DashboardService {
  /** Five summary cards at the top of the Dashboard page. */
  async summary(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeInstances, totalContacts, sentToday, queued, failed, deliveredToday] =
      await Promise.all([
        prisma.instance.count({ where: { workspaceId, status: "CONNECTED" } }),
        prisma.contact.count({ where: { workspaceId, status: "ACTIVE" } }),
        prisma.message.count({
          where: { instance: { workspaceId }, createdAt: { gte: startOfToday } }
        }),
        prisma.message.count({ where: { instance: { workspaceId }, status: "QUEUED" } }),
        prisma.message.count({ where: { instance: { workspaceId }, status: "FAILED" } }),
        prisma.message.count({
          where: {
            instance: { workspaceId },
            createdAt: { gte: startOfToday },
            status: { in: ["SENT", "DELIVERED", "READ"] }
          }
        })
      ]);

    const deliveryRate =
      sentToday === 0 ? 100 : Math.round((deliveredToday / sentToday) * 1000) / 10;

    return {
      activeInstances,
      totalContacts,
      messagesSentToday: sentToday,
      messagesQueued: queued,
      deliveryRate,
      failedMessages: failed
    };
  }

  /** Last 5 campaigns for the dashboard recent-campaigns panel. */
  async recentCampaigns(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { messages: true } }
      }
    });

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status.toLowerCase(),
      recipients: c._count.messages,
      createdAt: c.createdAt
    }));
  }

  /**
   * Messages sent/delivered/failed per day for the last N days.
   * Used by the Analytics line chart.
   */
  async messagesOverTime(workspaceId: string, userId: string, days = 7) {
    await workspacesService.assertMembership(workspaceId, userId);

    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const messages = await prisma.message.findMany({
      where: { instance: { workspaceId }, createdAt: { gte: since } },
      select: { createdAt: true, status: true }
    });

    // Build a bucket per date
    const buckets: Record<string, { sent: number; delivered: number; failed: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets[key] = { sent: 0, delivered: 0, failed: 0 };
    }

    for (const msg of messages) {
      const key = new Date(msg.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      if (!buckets[key]) continue;
      buckets[key].sent++;
      if (msg.status === "DELIVERED" || msg.status === "READ") buckets[key].delivered++;
      if (msg.status === "FAILED") buckets[key].failed++;
    }

    return Object.entries(buckets).map(([date, vals]) => ({ date, ...vals }));
  }

  /** Top 5 campaigns by message count for the Analytics bar chart. */
  async topCampaigns(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      include: { _count: { select: { messages: true } } },
      orderBy: { messages: { _count: "desc" } },
      take: 5
    });

    return campaigns.map((c) => ({
      name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
      messages: c._count.messages
    }));
  }

  /** Failure reason breakdown for the pie chart. */
  async failureReasons(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const failed = await prisma.message.findMany({
      where: { instance: { workspaceId }, status: "FAILED" },
      select: { failureReason: true }
    });

    const counts: Record<string, number> = {};
    for (const m of failed) {
      const reason = m.failureReason
        ? m.failureReason.split(":")[0].slice(0, 30)
        : "Unknown";
      counts[reason] = (counts[reason] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /** Queue snapshot — counts by status for the queue monitor page. */
  async queueSnapshot(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const [queued, sending, sent, failed, recentMessages] = await Promise.all([
      prisma.message.count({ where: { instance: { workspaceId }, status: "QUEUED" } }),
      prisma.message.count({ where: { instance: { workspaceId }, status: "SENDING" } }),
      prisma.message.count({ where: { instance: { workspaceId }, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
      prisma.message.count({ where: { instance: { workspaceId }, status: "FAILED" } }),
      // Most recent in-flight messages for the Kanban cards
      prisma.message.findMany({
        where: {
          instance: { workspaceId },
          status: { in: ["QUEUED", "SENDING", "SENT", "FAILED"] }
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          to: true,
          status: true,
          createdAt: true,
          sentAt: true,
          failureReason: true,
          campaign: { select: { name: true } },
          contact: { select: { fullName: true } }
        }
      })
    ]);

    return {
      counts: { queued, sending, sent, failed },
      messages: recentMessages.map((m) => ({
        id: m.id,
        contact: m.contact?.fullName ?? m.to,
        phone: m.to,
        campaign: m.campaign?.name ?? "Direct",
        status: m.status.toLowerCase(),
        createdAt: m.createdAt,
        sentAt: m.sentAt,
        failureReason: m.failureReason
      }))
    };
  }
}

export const dashboardService = new DashboardService();