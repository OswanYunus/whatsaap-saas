import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import type {
  CreateContactInput,
  UpdateContactInput,
  BulkImportContactInput,
  ListContactsQuery
} from "./contacts.schema";

export class ContactsService {
  async list(query: ListContactsQuery, userId: string) {
    await workspacesService.assertMembership(query.workspaceId, userId);

    const where = {
      workspaceId: query.workspaceId,
      status: query.status,
      ...(query.groupName ? { groupName: query.groupName } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" as const } },
              { phoneNumber: { contains: query.search } }
            ]
          }
        : {})
    };

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);

    return {
      contacts,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize))
      }
    };
  }

  async listGroups(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const rows = await prisma.contact.findMany({
      where: { workspaceId, groupName: { not: null } },
      distinct: ["groupName"],
      select: { groupName: true }
    });

    return rows.map((r) => r.groupName).filter((g): g is string => Boolean(g));
  }

  async listTags(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    // Collect every tags[] array, flatten, deduplicate, sort
    const rows = await prisma.contact.findMany({
      where: { workspaceId },
      select: { tags: true }
    });

    const tagSet = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tags) {
        if (tag) tagSet.add(tag);
      }
    }

    return Array.from(tagSet).sort();
  }

  async create(input: CreateContactInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    let cleanPhone = input.phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "254" + cleanPhone.slice(1);
    }

    const existing = await prisma.contact.findUnique({
      where: {
        workspaceId_phoneNumber: {
          workspaceId: input.workspaceId,
          phoneNumber: cleanPhone
        }
      }
    });
    if (existing) {
      throw new AppError("A contact with this phone number already exists", 409, "CONTACT_EXISTS");
    }

    return prisma.contact.create({
      data: {
        workspaceId: input.workspaceId,
        fullName: input.fullName,
        phoneNumber: cleanPhone,
        groupName: input.groupName || null,
        tags: input.tags || [],
        notes: input.notes || null,
        status: input.status
      }
    });
  }

  async bulkImport(input: BulkImportContactInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    // Fetch existing phone numbers in this workspace to check duplicates
    const existing = await prisma.contact.findMany({
      where: { workspaceId: input.workspaceId },
      select: { phoneNumber: true }
    });
    const existingSet = new Set(existing.map((c) => c.phoneNumber));

    const toInsert: any[] = [];
    const seenInBatch = new Set<string>();
    let duplicatesCount = 0;
    let invalidCount = 0;

    for (const c of input.contacts) {
      let cleanPhone = c.phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "254" + cleanPhone.slice(1);
      }

      // Basic length check for phone validation
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        invalidCount++;
        continue;
      }

      if (existingSet.has(cleanPhone) || seenInBatch.has(cleanPhone)) {
        duplicatesCount++;
        continue;
      }

      seenInBatch.add(cleanPhone);
      toInsert.push({
        workspaceId: input.workspaceId,
        fullName: c.name,
        phoneNumber: cleanPhone,
        groupName: c.groupName || null,
        tags: [],
        notes: null,
        status: "ACTIVE" as const
      });
    }

    if (toInsert.length > 0) {
      await prisma.contact.createMany({
        data: toInsert
      });
    }

    return {
      imported: toInsert.length,
      duplicates: duplicatesCount,
      invalid: invalidCount,
      skipped: duplicatesCount + invalidCount,
      submitted: input.contacts.length
    };
  }

  async update(contactId: string, input: UpdateContactInput, userId: string) {
    const contact = await this.findOwned(contactId, userId);

    let cleanPhone = input.phoneNumber;
    if (cleanPhone) {
      cleanPhone = cleanPhone.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "254" + cleanPhone.slice(1);
      }

      // Check unique constraint if phone is changing
      if (cleanPhone !== contact.phoneNumber) {
        const existing = await prisma.contact.findUnique({
          where: {
            workspaceId_phoneNumber: {
              workspaceId: contact.workspaceId,
              phoneNumber: cleanPhone
            }
          }
        });
        if (existing) {
          throw new AppError("A contact with this phone number already exists", 409, "CONTACT_EXISTS");
        }
      }
    }

    return prisma.contact.update({
      where: { id: contact.id },
      data: {
        fullName: input.fullName,
        phoneNumber: cleanPhone,
        groupName: input.groupName,
        tags: input.tags,
        notes: input.notes,
        status: input.status
      }
    });
  }

  async delete(contactId: string, userId: string) {
    const contact = await this.findOwned(contactId, userId);
    await prisma.contact.delete({ where: { id: contact.id } });
    return { id: contact.id, deleted: true };
  }

  /** Loads a contact and confirms the caller belongs to its workspace. */
  private async findOwned(contactId: string, userId: string) {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new AppError("Contact not found", 404, "CONTACT_NOT_FOUND");
    }
    await workspacesService.assertMembership(contact.workspaceId, userId);
    return contact;
  }
}

export const contactsService = new ContactsService();