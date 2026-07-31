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
import apiKeyAuthPlugin from "./plugins/api-key-auth";

import healthRoutes from "./modules/health/health.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes";
import workspacesRoutes from "./modules/workspaces/workspaces.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import campaignsRoutes from "./modules/campaigns/campaigns.routes";
import campaignTemplateRoutes from "./modules/campaigns/campaign-template.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import apiKeysRoutes from "./modules/api-keys/api-keys.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import workspaceSettingsRoutes from "./modules/workspaces/workspace-settings.routes";
import publicSendRoutes from "./modules/public/public-send.routes";

import { whatsappManager } from "./modules/whatsapp/whatsapp.manager";

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
  await app.register(apiKeyAuthPlugin);

  // --- Routes ---
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(usersRoutes, { prefix: "/api" });
  await app.register(whatsappRoutes, { prefix: "/api" });
  await app.register(workspacesRoutes, { prefix: "/api" });
  await app.register(contactsRoutes, { prefix: "/api" });
  await app.register(campaignsRoutes, { prefix: "/api" });
  await app.register(campaignTemplateRoutes, { prefix: "/api" });
  await app.register(messagesRoutes, { prefix: "/api" });
  await app.register(apiKeysRoutes, { prefix: "/api" });
  await app.register(dashboardRoutes, { prefix: "/api" });
  await app.register(workspaceSettingsRoutes, { prefix: "/api" });
  await app.register(publicSendRoutes, { prefix: "/api" });

  app.addHook("onReady", async () => {
    if (process.env.NODE_ENV !== "test") {
      whatsappManager.initialize().catch((err) => {
        app.log.error(err, "Failed to auto-restore WhatsApp connections");
      });
    }
  });

  return app;
}

export const config = { env };