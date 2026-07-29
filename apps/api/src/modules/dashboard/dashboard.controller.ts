import type { FastifyRequest } from "fastify";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  async summary(request: FastifyRequest<{ Querystring: { workspaceId: string } }>) {
    return dashboardService.summary(request.query.workspaceId, request.authUser!.id);
  }
}

export const dashboardController = new DashboardController();