import type { FastifyInstance } from "fastify";
import { workspacesController } from "./workspaces.controller";

export default async function workspacesRoutes(fastify: FastifyInstance) {
  fastify.get("/workspaces", {
    preHandler: [fastify.authenticate],
    handler: (request) => workspacesController.list(request)
  });

  fastify.get("/workspaces/:id/members", {
    preHandler: [fastify.authenticate],
    handler: (request) => workspacesController.members(request as never)
  });
}