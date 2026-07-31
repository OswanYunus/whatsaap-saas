import type { FastifyRequest } from "fastify";
import { dashboardService } from "./dashboard.service";

interface WorkspaceQuery {
  workspaceId: string;
  days?: number;
}

export class DashboardController {
  async summary(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    return dashboardService.summary(request.query.workspaceId, request.authUser!.id);
  }

  async recentCampaigns(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    return dashboardService.recentCampaigns(request.query.workspaceId, request.authUser!.id);
  }

  async messagesOverTime(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    const days = Number(request.query.days) || 7;
    return dashboardService.messagesOverTime(request.query.workspaceId, request.authUser!.id, days);
  }

  async topCampaigns(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    return dashboardService.topCampaigns(request.query.workspaceId, request.authUser!.id);
  }

  async failureReasons(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    return dashboardService.failureReasons(request.query.workspaceId, request.authUser!.id);
  }

  async queueSnapshot(request: FastifyRequest<{ Querystring: WorkspaceQuery }>) {
    return dashboardService.queueSnapshot(request.query.workspaceId, request.authUser!.id);
  }
}

export const dashboardController = new DashboardController();