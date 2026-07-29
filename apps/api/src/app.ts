import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import jwt from "@fastify/jwt";
import { env } from "@waas/config";
import { logger } from "./utils/logger";
import { jwtConfig } from "./utils/jwt";

import prismaPlugin from "./plugins/prisma";
import errorHandlerPlugin from "./plugins/error-handler";
import authMiddleware from "./middleware/auth.middleware";

import healthRoutes from "./modules/health/health.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes";

/**
 * Builds and returns a fully configured Fastify instance without
 * starting it. Split from server.ts so the same app can be reused in
 * integration tests (inject requests without binding a real port).
 */
export async function buildApp() {
  const app = Fastify({
    logger,
    trustProxy: true
  });

  // --- Core plugins ---
  await app.register(cors, { origin: true, credentials: true });
  await app.register(sensible);
  await app.register(jwt, { secret: jwtConfig.accessSecret });

  await app.register(prismaPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authMiddleware);

  // --- Routes ---
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(usersRoutes, { prefix: "/api" });
  await app.register(whatsappRoutes, { prefix: "/api" });

  return app;
}

export const config = { env };