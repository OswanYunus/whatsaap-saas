import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

export class WorkspacesService {
  async listForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId
      },
      include: {
        workspace: true
      }
    });

    return memberships.map((m) => m.workspace);
  }

  async assertOwnership(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: "OWNER"
      },
      include: {
        workspace: true
      }
    });

    if (!membership) {
      throw new AppError(
        "Workspace not found",
        404,
        "WORKSPACE_NOT_FOUND"
      );
    }

    return membership.workspace;
  }
}

export const workspacesService = new WorkspacesService();