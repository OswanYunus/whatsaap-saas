import type { FastifyInstance } from "fastify";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } from "./auth.schema";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", {
    handler: async (request, reply) => {
      const body = registerSchema.parse(request.body);
      request.body = body;
      return authController.register(request as never, reply);
    }
  });

  fastify.post("/auth/login", {
    handler: async (request, reply) => {
      const body = loginSchema.parse(request.body);
      request.body = body;
      return authController.login(request as never, reply);
    }
  });

  fastify.post("/auth/verify-email", {
    handler: async (request, reply) => {
      const body = verifyEmailSchema.parse(request.body);
      request.body = body;
      return authController.verifyEmail(request as never, reply);
    }
  });

  fastify.post("/auth/forgot-password", {
    handler: async (request, reply) => {
      const body = forgotPasswordSchema.parse(request.body);
      request.body = body;
      return authController.forgotPassword(request as never, reply);
    }
  });

  fastify.post("/auth/verify-reset-code", {
    handler: async (request, reply) => {
      const body = verifyResetCodeSchema.parse(request.body);
      request.body = body;
      return authController.verifyResetCode(request as never, reply);
    }
  });

  fastify.post("/auth/reset-password", {
    handler: async (request, reply) => {
      const body = resetPasswordSchema.parse(request.body);
      request.body = body;
      return authController.resetPassword(request as never, reply);
    }
  });

  fastify.get("/auth/me", {
    preHandler: [fastify.authenticate],
    handler: authController.me
  });
}