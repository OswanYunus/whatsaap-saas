import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";

/**
 * Centralized error handling.
 *
 * Every thrown error (validation, auth, unexpected) funnels through here so
 * that API responses have one consistent shape:
 *   { error: { message, code, details? } }
 *
 * This keeps route handlers free of repetitive try/catch blocks — they can
 * just `throw` or use `fastify.httpErrors.*` and let this hook format it.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError | AppError | ZodError, request, reply) => {
    request.log.error({ err: error }, "Unhandled request error");

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten()
        }
      });
    }

    // Fastify's built-in validation errors (from route schemas) carry a statusCode.
    const statusCode = "statusCode" in error && error.statusCode ? error.statusCode : 500;
    const message = statusCode === 500 ? "Internal server error" : error.message;

    return reply.status(statusCode).send({
      error: {
        message,
        code: statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"
      }
    });
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        message: `Route ${request.method} ${request.url} not found`,
        code: "NOT_FOUND"
      }
    });
  });
});