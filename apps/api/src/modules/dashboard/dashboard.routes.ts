import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { dashboardController } from "./dashboard.controller";

const summaryQuerySchema = z.object({ workspaceId: z.string().cuid() });

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/dashboard/summary", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = summaryQuerySchema.parse(request.query);
      return dashboardController.summary(request as never);
    }
  });
}