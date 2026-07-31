import { prisma } from "@waas/database";
import { workspacesService } from "./workspaces.service";

export class WorkspaceSettingsService {
  async getOrCreate(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    let settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId }
    });

    if (!settings) {
      settings = await prisma.workspaceSettings.create({
        data: {
          workspaceId,
          softwareName: "Cerebro",
          footerEnabled: true
        }
      });
    }

    return settings;
  }

  async update(workspaceId: string, data: { softwareName?: string; footerEnabled?: boolean }, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    return prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: {
        softwareName: data.softwareName,
        footerEnabled: data.footerEnabled
      },
      create: {
        workspaceId,
        softwareName: data.softwareName || "Cerebro",
        footerEnabled: data.footerEnabled !== false
      }
    });
  }
}

export const workspaceSettingsService = new WorkspaceSettingsService();
