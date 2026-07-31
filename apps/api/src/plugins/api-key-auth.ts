import bcrypt from "bcrypt";
import { prisma } from "@waas/database";
import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

/**
 * Adds `fastify.authenticateApiKey` — a preHandler that accepts
 * `Authorization: Bearer wak_xxx` workspace API keys in addition to
 * the existing JWT-based `fastify.authenticate`.
 *
 * On success it sets `request.apiWorkspaceId` so downstream handlers
 * know which workspace the key belongs to.
 */
declare module "fastify" {
  interface FastifyInstance {
    authenticateApiKey: (request: FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    apiWorkspaceId?: string;
  }
}

const apiKeyAuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticateApiKey", async (request: FastifyRequest, reply: import("fastify").FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: { message: "Missing API key", code: "MISSING_API_KEY" } });
    }

    const rawKey = authHeader.slice(7).trim();

    // Key prefix is the first 12 chars — use it to narrow DB lookup
    const prefix = rawKey.slice(0, 12);
    const candidates = await prisma.workspaceApiKey.findMany({
      where: { keyPrefix: prefix }
    });

    if (candidates.length === 0) {
      return reply.status(401).send({ error: { message: "Invalid API key", code: "INVALID_API_KEY" } });
    }

    // Verify the full key against each candidate hash
    let matched: typeof candidates[0] | null = null;
    for (const candidate of candidates) {
      const valid = await bcrypt.compare(rawKey, candidate.keyHash);
      if (valid) { matched = candidate; break; }
    }

    if (!matched) {
      return reply.status(401).send({ error: { message: "Invalid API key", code: "INVALID_API_KEY" } });
    }

    // Stamp last-used timestamp (fire-and-forget)
    prisma.workspaceApiKey.update({
      where: { id: matched.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    request.apiWorkspaceId = matched.workspaceId;
  });
};

export default fp(apiKeyAuthPlugin, { name: "api-key-auth" });
