import type { FastifyRequest } from "fastify";
import { prisma } from "@waas/database";
import { workspacesService } from "./workspaces.service";

export class WorkspacesController {
  async list(request: FastifyRequest) {
    const workspaces = await workspacesService.listForUser(request.authUser!.id);
    return { workspaces };
  }

  async members(request: FastifyRequest<{ Params: { id: string } }>) {
    await workspacesService.assertMembership(request.params.id, request.authUser!.id);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: request.params.id },
      include: { user: { select: { id: true, email: true, createdAt: true } } }
    });

    return {
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        userId: m.user.id,
        email: m.user.email,
        memberSince: m.user.createdAt
      }))
    };
  }
}

export const workspacesController = new WorkspacesController();