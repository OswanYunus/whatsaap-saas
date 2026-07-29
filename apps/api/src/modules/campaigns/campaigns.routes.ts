import type { FastifyInstance } from "fastify";
import { campaignsController } from "./campaigns.controller";
import {
  createCampaignSchema,
  updateCampaignStatusSchema,
  listCampaignsQuerySchema
} from "./campaigns.schema";

export default async function campaignsRoutes(fastify: FastifyInstance) {
  fastify.get("/campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listCampaignsQuerySchema.parse(request.query);
      return campaignsController.list(request as never);
    }
  });

  fastify.post("/campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = createCampaignSchema.parse(request.body);
      return campaignsController.create(request as never, reply);
    }
  });

  fastify.patch("/campaigns/:id/status", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateCampaignStatusSchema.parse(request.body);
      return campaignsController.updateStatus(request as never);
    }
  });

  fastify.delete("/campaigns/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignsController.remove(request as never)
  });
}