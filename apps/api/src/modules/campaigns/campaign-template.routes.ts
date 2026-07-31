import type { FastifyInstance } from "fastify";
import { campaignTemplateController } from "./campaign-template.controller";
import {
  createCampaignTemplateSchema,
  updateCampaignTemplateSchema,
  listCampaignTemplatesQuerySchema
} from "./campaign-template.schema";

export default async function campaignTemplateRoutes(fastify: FastifyInstance) {
  fastify.get("/campaign-templates", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listCampaignTemplatesQuerySchema.parse(request.query);
      return campaignTemplateController.list(request as never);
    }
  });

  fastify.get("/campaign-templates/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignTemplateController.get(request as never)
  });

  fastify.post("/campaign-templates", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = createCampaignTemplateSchema.parse(request.body);
      return campaignTemplateController.create(request as never, reply);
    }
  });

  fastify.patch("/campaign-templates/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateCampaignTemplateSchema.parse(request.body);
      return campaignTemplateController.update(request as never);
    }
  });

  fastify.delete("/campaign-templates/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => campaignTemplateController.remove(request as never)
  });
}
