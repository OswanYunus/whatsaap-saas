import type { FastifyRequest, FastifyReply } from "fastify";
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
}

export const adminController = new AdminController();
