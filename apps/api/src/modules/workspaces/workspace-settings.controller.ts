import type { FastifyRequest } from "fastify";
import { workspaceSettingsService } from "./workspace-settings.service";
import type {
  GetWorkspaceSettingsQuery,
  UpdateWorkspaceSettingsInput
} from "./workspace-settings.schema";

export class WorkspaceSettingsController {
  async get(request: FastifyRequest<{ Querystring: GetWorkspaceSettingsQuery }>) {
    return workspaceSettingsService.getOrCreate(request.query.workspaceId, request.authUser!.id);
  }

  async update(request: FastifyRequest<{ Body: UpdateWorkspaceSettingsInput }>) {
    const { workspaceId, ...data } = request.body;
    return workspaceSettingsService.update(workspaceId, data, request.authUser!.id);
  }
}

export const workspaceSettingsController = new WorkspaceSettingsController();
