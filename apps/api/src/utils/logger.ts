import pino from "pino";
import { env } from "@waas/config";

/**
 * Central logger instance. Pretty-printed in development for readability,
 * structured JSON in production so it can be shipped to a log aggregator
 * (Datadog, CloudWatch, Loki, etc.) without extra parsing logic.
 */
export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname"
          }
        }
});