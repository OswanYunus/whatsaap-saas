import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { prisma, type PrismaClient } from "@waas/database";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

/**
 * Attaches the shared Prisma client to the Fastify instance as
 * `fastify.prisma`, and makes sure the connection is closed cleanly
 * when the server shuts down. Wrapped with `fastify-plugin` so the
 * decoration is visible to sibling plugins/routes rather than being
 * scoped to a child encapsulation context.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});