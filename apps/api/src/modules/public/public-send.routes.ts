import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { developerApiService } from "../developer-api/developer-api.service";

const legacySendSchema = z.object({
  to: z.string().min(7).max(20),
  message: z.string().min(1).max(4096),
  instanceId: z.string().cuid().optional()
});

export default async function publicSendRoutes(fastify: FastifyInstance) {
  fastify.post("/v1/send", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request, reply) => {
      const body = legacySendSchema.parse(request.body);
      const result = await developerApiService.sendMessage(request.apiWorkspaceId!, {
        recipient: body.to,
        message: body.message,
        instanceId: body.instanceId
      });

      return reply.status(202).send(result);
    }
  });
}
