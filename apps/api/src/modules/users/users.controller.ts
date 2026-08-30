import type { FastifyRequest, FastifyReply } from "fastify";
import { usersService } from "./users.service";

export class UsersController {
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = await usersService.findById(request.authUser!.id);

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      workspaces: user.workspaces.map((w) => ({
        id: w.workspace.id,
        name: w.workspace.name
      })),
      createdAt: user.createdAt
    });
  }

  async deleteProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.authUser!.id;
    await usersService.deleteAccount(userId);
    return reply.send({ success: true, message: "Account deleted successfully." });
  }
}

export const usersController = new UsersController();