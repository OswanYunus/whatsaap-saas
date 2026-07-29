import { buildApp } from "./app";
import { env } from "@waas/config";
import { logger } from "./utils/logger";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    logger.info(`API server listening on http://${env.API_HOST}:${env.API_PORT}`);
  } catch (err) {
    logger.error(err, "Failed to start server");
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();