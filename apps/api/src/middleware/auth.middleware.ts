import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    /**
     * Route-level guard. Use as a preHandler on any route that requires
     * an authenticated user:
     *
     *   fastify.get("/protected", { preHandler: [fastify.authenticate] }, handler)
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Registers the `fastify.authenticate` decorator, which verifies the
 * JWT access token from the Authorization header and populates
 * `request.authUser`. Actual token signing/verification is delegated
 * to @fastify/jwt (registered in app.ts); this module only wires up
 * the reusable guard used by protected routes.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.authUser = {
        id: request.user.sub,
        email: request.user.email
      };
    } catch {
      reply.status(401).send({
        error: {
          message: "Missing or invalid authentication token",
          code: "UNAUTHORIZED"
        }
      });
    }
  });
});