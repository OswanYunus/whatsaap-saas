import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

export const createApiKeySchema = z.object({
  workspaceId: cuid,
  label: z.string().min(1).max(60)
});
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const listApiKeysQuerySchema = z.object({
  workspaceId: cuid
});
export type ListApiKeysQuery = z.infer<typeof listApiKeysQuerySchema>;