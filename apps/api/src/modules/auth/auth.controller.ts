import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import type { RegisterInput, LoginInput, VerifyEmailInput, ForgotPasswordInput, VerifyResetCodeInput, ResetPasswordInput } from "./auth.schema";

export class AuthController {
  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    const user = await authService.register(request.body);
    return reply.status(201).send({
      user: { id: user.id, email: user.email, name: user.name, isVerified: false },
      message: "Registration successful. Please verify your email."
    });
  }

  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const user = await authService.validateCredentials(request.body);

    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email },
      { expiresIn: "30d" }
    );

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, isAdmin: user.isAdmin },
      accessToken
    });
  }

  async verifyEmail(request: FastifyRequest<{ Body: VerifyEmailInput }>, reply: FastifyReply) {
    const user = await authService.verifyEmail(request.body.email, request.body.code);

    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email },
      { expiresIn: "30d" }
    );

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, isAdmin: user.isAdmin },
      accessToken
    });
  }

  async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordInput }>, reply: FastifyReply) {
    const result = await authService.forgotPassword(request.body.phoneNumber);
    return reply.send(result);
  }

  async verifyResetCode(request: FastifyRequest<{ Body: VerifyResetCodeInput }>, reply: FastifyReply) {
    const result = await authService.verifyResetCode(request.body.phoneNumber, request.body.code);
    return reply.send(result);
  }

  async resetPassword(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
    const result = await authService.resetPassword(request.body);
    return reply.send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ user: request.authUser });
  }
}

export const authController = new AuthController();