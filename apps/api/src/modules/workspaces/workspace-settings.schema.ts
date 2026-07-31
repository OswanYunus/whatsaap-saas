import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

export const getWorkspaceSettingsSchema = z.object({
  workspaceId: cuid
});
export type GetWorkspaceSettingsQuery = z.infer<typeof getWorkspaceSettingsSchema>;

export const updateWorkspaceSettingsSchema = z.object({
  workspaceId: cuid,
  softwareName: z.string().min(1).max(50).optional(),
  footerEnabled: z.boolean().optional()
});
export type UpdateWorkspaceSettingsInput = z.infer<typeof updateWorkspaceSettingsSchema>;
