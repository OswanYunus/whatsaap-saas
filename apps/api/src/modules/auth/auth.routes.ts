import type { FastifyInstance } from "fastify";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.schema";

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

  fastify.get("/auth/me", {
    preHandler: [fastify.authenticate],
    handler: authController.me
  });
}