import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { whatsappService } from "./whatsapp.service";

const createInstanceSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1).max(100)
});

/**
 * Routes exposed today only cover instance bookkeeping (create/status).
 * QR pairing and message sending routes will be added once
 * WhatsAppService is actually wired up to Baileys.
 */
export default async function whatsappRoutes(fastify: FastifyInstance) {
  fastify.post("/whatsapp/instances", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { workspaceId, name } = createInstanceSchema.parse(request.body);
      const instance = await whatsappService.createInstance(workspaceId, name);
      return reply.status(201).send(instance);
    }
  });

  fastify.get("/whatsapp/instances/:id/status", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      return whatsappService.getStatus(id);
    }
  });
}