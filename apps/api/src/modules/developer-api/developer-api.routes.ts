import type { FastifyInstance } from "fastify";
import {
  developerCreateCampaignSchema,
  developerScheduleMessageSchema,
  developerSendMessageSchema
} from "./developer-api.schema";
import { developerApiService } from "./developer-api.service";

export default async function developerApiRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => ({ status: "ok" }));

  fastify.post("/messages/send", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request, reply) => {
      const body = developerSendMessageSchema.parse(request.body);
      const result = await developerApiService.sendMessage(request.apiWorkspaceId!, body);
      return reply.status(202).send(result);
    }
  });

  fastify.post("/messages/schedule", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request, reply) => {
      const body = developerScheduleMessageSchema.parse(request.body);
      const result = await developerApiService.scheduleMessage(request.apiWorkspaceId!, body);
      return reply.status(202).send(result);
    }
  });

  fastify.post("/campaigns", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request, reply) => {
      const body = developerCreateCampaignSchema.parse(request.body);
      const result = await developerApiService.createCampaign(request.apiWorkspaceId!, body);
      return reply.status(201).send(result);
    }
  });

  fastify.get("/messages/:id", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request) => {
      const params = request.params as { id: string };
      return developerApiService.getMessageStatus(request.apiWorkspaceId!, params.id);
    }
  });
}
