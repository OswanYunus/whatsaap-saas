import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

export class AdminController {
  async listUsers(_request: FastifyRequest, reply: FastifyReply) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isVerified: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return reply.send(users);
  }

  async toggleElevate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    if (user.email.toLowerCase() === "oswanbarackyunus@gmail.com") {
      throw new AppError("Cannot change status of the primary super user", 400, "BAD_REQUEST");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin }
    });

    return reply.send({ success: true, isAdmin: updated.isAdmin });
  }

  async toggleBlock(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    if (user.email.toLowerCase() === "oswanbarackyunus@gmail.com") {
      throw new AppError("Cannot block the primary super user", 400, "BAD_REQUEST");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: !user.isBlocked }
    });

    return reply.send({ success: true, isBlocked: updated.isBlocked });
  }

  async resetUserPassword(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { password } = request.body as { password?: string };

    if (!password || password.trim().length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400, "BAD_REQUEST");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    return reply.send({ success: true, message: "Password updated successfully" });
  }
}

export const adminController = new AdminController();
