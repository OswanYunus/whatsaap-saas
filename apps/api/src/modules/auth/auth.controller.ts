import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import type { RegisterInput, LoginInput } from "./auth.schema";

/**
 * Thin HTTP layer: parse the (already-validated) request, call the
 * service, shape the response. No business logic lives here.
 */
export class AuthController {
  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    const user = await authService.register(request.body);

    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email },
      { expiresIn: "30d" }
    );

    return reply.status(201).send({
      user: { id: user.id, email: user.email },
      accessToken
    });
  }

  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const user = await authService.validateCredentials(request.body);

    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email },
      { expiresIn: "30d" }
    );

    return reply.send({
      user: { id: user.id, email: user.email },
      accessToken
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ user: request.authUser });
  }
}

export const authController = new AuthController();