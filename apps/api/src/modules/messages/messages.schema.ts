import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

export const listMessagesQuerySchema = z.object({
  workspaceId: cuid,
  campaignId: cuid.optional(),
  status: z.enum(["QUEUED", "SENT", "DELIVERED", "READ", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export const queueSummaryQuerySchema = z.object({
  workspaceId: cuid
});
export type QueueSummaryQuery = z.infer<typeof queueSummaryQuerySchema>;