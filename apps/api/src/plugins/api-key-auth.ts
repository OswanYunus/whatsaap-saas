import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const buckets = new Map<string, { count: number; resetAt: number }>();

declare module "fastify" {
  interface FastifyInstance {
    authenticateApiKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    apiWorkspaceId?: string;
    apiKeyId?: string;
  }
}

const apiKeyAuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticateApiKey", async (request: FastifyRequest, reply: FastifyReply) => {
    const rawHeader = request.headers["x-api-key"];
    const rawKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!rawKey) {
      return reply.status(401).send({ error: { message: "Missing API key", code: "MISSING_API_KEY" } });
    }

    const key = rawKey.trim();
    const candidates = await prisma.apiKey.findMany({
      where: {
        keyPrefix: key.slice(0, 12),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });

    let matched: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(key, candidate.keyHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      return reply.status(401).send({ error: { message: "Invalid API key", code: "INVALID_API_KEY" } });
    }

    const now = Date.now();
    const bucket = buckets.get(matched.id);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(matched.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else if (bucket.count >= RATE_LIMIT_MAX) {
      return reply.status(429).send({ error: { message: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" } });
    } else {
      bucket.count += 1;
    }

    prisma.apiKey.update({
      where: { id: matched.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    request.apiWorkspaceId = matched.workspaceId;
    request.apiKeyId = matched.id;
  });

  fastify.addHook("onResponse", async (request, reply) => {
    if (!request.url.startsWith("/api/v1/")) return;

    await prisma.developerApiRequestLog.create({
      data: {
        workspaceId: request.apiWorkspaceId,
        apiKeyId: request.apiKeyId,
        endpoint: request.routeOptions.url ?? request.url.split("?")[0],
        method: request.method,
        ip: request.ip,
        success: reply.statusCode < 400,
        responseCode: reply.statusCode
      }
    }).catch((err) => {
      request.log.warn({ err }, "Failed to write Developer API request log");
    });
  });
};

export default fp(apiKeyAuthPlugin, { name: "api-key-auth" });
