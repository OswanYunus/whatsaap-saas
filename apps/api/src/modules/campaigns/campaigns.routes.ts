import type { FastifyInstance } from "fastify";
import { campaignsController } from "./campaigns.controller";
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
  listCampaignsQuerySchema,
  audiencePreviewSchema
} from "./campaigns.schema";

export default async function campaignsRoutes(fastify: FastifyInstance) {
  fastify.get("/campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listCampaignsQuerySchema.parse(request.query);
      return campaignsController.list(request as never);
    }
  });

  fastify.get("/campaigns/audience-preview", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = audiencePreviewSchema.parse(request.query);
      return campaignsController.audiencePreview(request as never);
    }
  });

  fastify.get("/campaigns/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignsController.get(request as never)
  });

  fastify.post("/campaigns", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = createCampaignSchema.parse(request.body);
      return campaignsController.create(request as never, reply);
    }
  });

  fastify.patch("/campaigns/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateCampaignSchema.parse(request.body);
      return campaignsController.update(request as never);
    }
  });

  fastify.patch("/campaigns/:id/status", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateCampaignStatusSchema.parse(request.body);
      return campaignsController.updateStatus(request as never);
    }
  });

  fastify.post("/campaigns/:id/dispatch", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignsController.dispatch(request as never)
  });

  fastify.delete("/campaigns/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignsController.remove(request as never)
  });

  fastify.get("/campaigns/:id/analytics", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignsController.getAnalytics(request as never)
  });
}