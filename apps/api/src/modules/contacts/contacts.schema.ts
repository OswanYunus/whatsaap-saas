import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

export const createContactSchema = z.object({
  workspaceId: cuid,
  fullName: z.string().min(1).max(120),
  phoneNumber: z.string().min(6).max(30),
  groupName: z.string().max(60).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE")
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phoneNumber: z.string().min(6).max(30).optional(),
  groupName: z.string().max(60).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional()
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const bulkImportContactSchema = z.object({
  workspaceId: cuid,
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        phone: z.string().min(6).max(30),
        groupName: z.string().max(60).optional().nullable()
      })
    )
    .min(1, "Provide at least one contact")
    .max(5000, "Import is limited to 5000 contacts at a time")
});
export type BulkImportContactInput = z.infer<typeof bulkImportContactSchema>;

export const listContactsQuerySchema = z.object({
  workspaceId: cuid,
  search: z.string().max(120).optional(),
  groupName: z.string().max(60).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;