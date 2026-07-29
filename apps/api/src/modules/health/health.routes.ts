import type { FastifyInstance } from "fastify";

/**
 * Liveness/readiness endpoint. Kept dependency-free (no DB/Redis calls)
 * for a fast liveness probe; a separate `/health/ready` could be added
 * later to check downstream dependencies before load balancers route
 * traffic to this instance.
 */
export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    return {
      status: "ok",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    };
  });
}