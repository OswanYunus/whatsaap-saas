import "fastify";
import "@fastify/jwt";

// Module augmentation so `request.user` and JWT payload shapes are
// strongly typed across every route handler in the codebase.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: {
      sub: string;
      email: string;
    };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    /** Populated by the `authenticate` decorator after JWT verification. */
    authUser?: {
      id: string;
      email: string;
    };
  }
}