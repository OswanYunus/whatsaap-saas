import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { whatsappManager } from "../whatsapp/whatsapp.manager";

/**
 * User-facing (non-auth) profile logic. Kept separate from AuthService,
 * which owns credential handling — this module owns everything else
 * about a user record (profile lookups, future profile updates, etc.).
 */
export class UsersService {
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
  workspaces: {
    include: {
      workspace: true
    }
  }
}
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  }

  async deleteAccount(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId, role: "OWNER" },
      include: {
        workspace: {
          include: {
            instances: true
          }
        }
      }
    });

    for (const m of memberships) {
      for (const inst of m.workspace.instances) {
        try {
          await whatsappManager.disconnectInstance(inst.id);
        } catch {
          // Ignore errors as we are deleting the database record
        }
      }
    }

    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length > 0) {
      await prisma.workspace.deleteMany({
        where: { id: { in: workspaceIds } }
      });
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }
}

export const usersService = new UsersService();