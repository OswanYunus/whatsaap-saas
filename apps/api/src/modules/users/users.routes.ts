import type { FastifyInstance } from "fastify";
import { usersController } from "./users.controller";

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get("/users/me", {
    preHandler: [fastify.authenticate],
    handler: usersController.getProfile
  });
}