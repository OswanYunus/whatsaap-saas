import type { FastifyInstance } from "fastify";
import { messagesController } from "./messages.controller";
import { listMessagesQuerySchema, queueSummaryQuerySchema } from "./messages.schema";
import { z } from "zod";

const recentQuerySchema = z.object({ workspaceId: z.string().cuid() });

export default async function messagesRoutes(fastify: FastifyInstance) {
  fastify.get("/messages", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listMessagesQuerySchema.parse(request.query);
      return messagesController.list(request as never);
    }
  });

  fastify.get("/messages/queue-summary", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = queueSummaryQuerySchema.parse(request.query);
      return messagesController.queueSummary(request as never);
    }
  });

  fastify.get("/messages/recent", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = recentQuerySchema.parse(request.query);
      return messagesController.recent(request as never);
    }
  });
}