import type { FastifyRequest, FastifyReply } from "fastify";
import { contactsService } from "./contacts.service";
import type {
  CreateContactInput,
  UpdateContactInput,
  BulkImportContactInput,
  ListContactsQuery
} from "./contacts.schema";

export class ContactsController {
  async list(request: FastifyRequest<{ Querystring: ListContactsQuery }>) {
    return contactsService.list(request.query, request.authUser!.id);
  }

  async listGroups(request: FastifyRequest<{ Querystring: { workspaceId: string } }>) {
    return {
      groups: await contactsService.listGroups(request.query.workspaceId, request.authUser!.id)
    };
  }

  async create(request: FastifyRequest<{ Body: CreateContactInput }>, reply: FastifyReply) {
    const contact = await contactsService.create(request.body, request.authUser!.id);
    return reply.status(201).send(contact);
  }

  async bulkImport(request: FastifyRequest<{ Body: BulkImportContactInput }>, reply: FastifyReply) {
    const result = await contactsService.bulkImport(request.body, request.authUser!.id);
    return reply.status(201).send(result);
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateContactInput }>) {
    return contactsService.update(request.params.id, request.body, request.authUser!.id);
  }

  async remove(request: FastifyRequest<{ Params: { id: string } }>) {
    return contactsService.delete(request.params.id, request.authUser!.id);
  }
}

export const contactsController = new ContactsController();