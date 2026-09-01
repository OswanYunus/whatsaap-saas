import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

const grantPackageSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PREMIUM", "PRO"]),
  days: z.coerce.number().int().min(1).max(366).default(30)
});

export class AdminController {
  async listUsers(_request: FastifyRequest, reply: FastifyReply) {
    const users = await prisma.user.findMany({
      include: {
        workspaces: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                plan: true,
                subscriptionExpiresAt: true,
                subscriptionCancelAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const result = users.map((u) => {
      const primaryWorkspace = u.workspaces[0]?.workspace;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phoneNumber: u.phoneNumber,
        isVerified: u.isVerified,
        isAdmin: u.isAdmin,
        isBlocked: u.isBlocked,
        lastLoginAt: u.lastLoginAt,
        lastActiveAt: u.lastActiveAt,
        createdAt: u.createdAt,
        workspaceId: primaryWorkspace?.id ?? null,
        plan: primaryWorkspace?.plan ?? "FREE",
        subscriptionExpiresAt: primaryWorkspace?.subscriptionExpiresAt ?? null,
        subscriptionCancelAt: primaryWorkspace?.subscriptionCancelAt ?? null,
        workspaceName: primaryWorkspace?.name ?? "N/A"
      };
    });

    return reply.send(result);
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

  async grantPackage(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { plan, days } = grantPackageSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        workspaces: {
          include: { workspace: true }
        }
      }
    });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const workspace = user.workspaces[0]?.workspace;
    if (!workspace) {
      throw new AppError("User has no workspace", 400, "NO_WORKSPACE");
    }

    const subscriptionExpiresAt = plan === "FREE"
      ? null
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        plan,
        subscriptionExpiresAt,
        subscriptionCancelAt: null
      }
    });

    return reply.send({
      success: true,
      workspaceId: updated.id,
      plan: updated.plan,
      subscriptionExpiresAt: updated.subscriptionExpiresAt,
      subscriptionCancelAt: updated.subscriptionCancelAt
    });
  }
}

export const adminController = new AdminController();
