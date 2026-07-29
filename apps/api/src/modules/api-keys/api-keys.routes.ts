import type { FastifyInstance } from "fastify";
import { apiKeysController } from "./api-keys.controller";
import { createApiKeySchema, listApiKeysQuerySchema } from "./api-keys.schema";

export default async function apiKeysRoutes(fastify: FastifyInstance) {
  fastify.get("/workspace-api-keys", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listApiKeysQuerySchema.parse(request.query);
      return apiKeysController.list(request as never);
    }
  });

  fastify.post("/workspace-api-keys", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = createApiKeySchema.parse(request.body);
      return apiKeysController.create(request as never, reply);
    }
  });

  fastify.delete("/workspace-api-keys/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => apiKeysController.revoke(request as never)
  });
}