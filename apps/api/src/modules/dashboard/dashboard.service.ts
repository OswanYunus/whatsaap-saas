import { prisma } from "@waas/database";
import { workspacesService } from "../workspaces/workspaces.service";

export class DashboardService {
  /** Backs the five summary cards at the top of the Dashboard page. */
  async summary(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeInstances, sentToday, queued, failed, deliveredToday] = await Promise.all([
      prisma.instance.count({ where: { workspaceId, status: "CONNECTED" } }),
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

    const deliveryRate = sentToday === 0 ? 100 : Math.round((deliveredToday / sentToday) * 1000) / 10;

    return {
      activeInstances,
      messagesSentToday: sentToday,
      messagesQueued: queued,
      deliveryRate,
      failedMessages: failed
    };
  }
}

export const dashboardService = new DashboardService();