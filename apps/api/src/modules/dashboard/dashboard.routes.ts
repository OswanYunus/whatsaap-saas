import type { FastifyInstance } from "fastify";
import { dashboardController } from "./dashboard.controller";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/dashboard/summary", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.summary(request as never)
  });

  fastify.get("/dashboard/recent-campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.recentCampaigns(request as never)
  });

  fastify.get("/dashboard/messages-over-time", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.messagesOverTime(request as never)
  });

  fastify.get("/dashboard/top-campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.topCampaigns(request as never)
  });

  fastify.get("/dashboard/failure-reasons", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.failureReasons(request as never)
  });

  fastify.get("/dashboard/queue-snapshot", {
    preHandler: [fastify.authenticate],
    handler: (request) => dashboardController.queueSnapshot(request as never)
  });
}