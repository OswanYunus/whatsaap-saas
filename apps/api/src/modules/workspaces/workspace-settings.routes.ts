import type { FastifyInstance } from "fastify";
import { workspaceSettingsController } from "./workspace-settings.controller";
import {
  getWorkspaceSettingsSchema,
  updateWorkspaceSettingsSchema
} from "./workspace-settings.schema";

export default async function workspaceSettingsRoutes(fastify: FastifyInstance) {
  fastify.get("/workspace-settings", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = getWorkspaceSettingsSchema.parse(request.query);
      return workspaceSettingsController.get(request as never);
    }
  });

  fastify.patch("/workspace-settings", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateWorkspaceSettingsSchema.parse(request.body);
      return workspaceSettingsController.update(request as never);
    }
  });
}
