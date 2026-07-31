import type { FastifyInstance } from "fastify";
import { contactsController } from "./contacts.controller";
import {
  createContactSchema,
  updateContactSchema,
  bulkImportContactSchema,
  listContactsQuerySchema
} from "./contacts.schema";

export default async function contactsRoutes(fastify: FastifyInstance) {
  fastify.get("/contacts", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.query = listContactsQuerySchema.parse(request.query);
      return contactsController.list(request as never);
    }
  });

  fastify.get("/contacts/groups", {
    preHandler: [fastify.authenticate],
    handler: (request) => contactsController.listGroups(request as never)
  });

  fastify.get("/contacts/tags", {
    preHandler: [fastify.authenticate],
    handler: (request) => contactsController.listTags(request as never)
  });

  fastify.post("/contacts", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = createContactSchema.parse(request.body);
      return contactsController.create(request as never, reply);
    }
  });

  fastify.post("/contacts/bulk", {
    preHandler: [fastify.authenticate],
    handler: (request, reply) => {
      request.body = bulkImportContactSchema.parse(request.body);
      return contactsController.bulkImport(request as never, reply);
    }
  });

  fastify.patch("/contacts/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => {
      request.body = updateContactSchema.parse(request.body);
      return contactsController.update(request as never);
    }
  });

  fastify.delete("/contacts/:id", {
    preHandler: [fastify.authenticate],
    handler: (request) => contactsController.remove(request as never)
  });
}