import { z } from "zod";

// IDs in this schema are cuids (Prisma @default(cuid())), not UUIDs —
// use a plain non-empty string check rather than z.string().uuid().
const cuid = z.string().cuid("Must be a valid id");

export const createContactSchema = z.object({
  workspaceId: cuid,
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(30),
  groupName: z.string().max(60).optional()
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(30).optional(),
  groupName: z.string().max(60).nullable().optional()
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const bulkImportContactSchema = z.object({
  workspaceId: cuid,
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        phone: z.string().min(6).max(30),
        groupName: z.string().max(60).optional()
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
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;