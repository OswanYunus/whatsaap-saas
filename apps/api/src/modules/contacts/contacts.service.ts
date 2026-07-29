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
      ...(query.groupName ? { groupName: query.groupName } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { phone: { contains: query.search } }
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

  async create(input: CreateContactInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    const existing = await prisma.contact.findUnique({
      where: { workspaceId_phone: { workspaceId: input.workspaceId, phone: input.phone } }
    });
    if (existing) {
      throw new AppError("A contact with this phone number already exists", 409, "CONTACT_EXISTS");
    }

    return prisma.contact.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        phone: input.phone,
        groupName: input.groupName
      }
    });
  }

  async bulkImport(input: BulkImportContactInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    // skipDuplicates relies on the @@unique([workspaceId, phone])
    // constraint — re-importing the same CSV twice is a safe no-op
    // for rows that already exist rather than an error.
    const result = await prisma.contact.createMany({
      data: input.contacts.map((c) => ({
        workspaceId: input.workspaceId,
        name: c.name,
        phone: c.phone,
        groupName: c.groupName
      })),
      skipDuplicates: true
    });

    return { imported: result.count, submitted: input.contacts.length };
  }

  async update(contactId: string, input: UpdateContactInput, userId: string) {
    const contact = await this.findOwned(contactId, userId);

    return prisma.contact.update({
      where: { id: contact.id },
      data: {
        name: input.name,
        phone: input.phone,
        groupName: input.groupName
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