import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

export const createCampaignSchema = z.object({
  workspaceId: cuid,
  instanceId: cuid,
  name: z.string().min(1).max(120),
  messageTemplate: z.string().min(1).max(4096),
  // Send to everyone in a group, or an explicit list of contact ids —
  // exactly one of the two must be provided.
  groupName: z.string().max(60).optional(),
  contactIds: z.array(cuid).optional()
}).refine((v) => Boolean(v.groupName) !== Boolean(v.contactIds?.length), {
  message: "Provide either groupName or contactIds, not both",
  path: ["groupName"]
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignStatusSchema = z.object({
  status: z.enum(["RUNNING", "PAUSED", "COMPLETED", "FAILED"])
});
export type UpdateCampaignStatusInput = z.infer<typeof updateCampaignStatusSchema>;

export const listCampaignsQuerySchema = z.object({
  workspaceId: cuid
});
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;