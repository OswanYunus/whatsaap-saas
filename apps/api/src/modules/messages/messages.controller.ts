import type { FastifyRequest } from "fastify";
import { messagesService } from "./messages.service";
import type { ListMessagesQuery, QueueSummaryQuery } from "./messages.schema";

export class MessagesController {
  async list(request: FastifyRequest<{ Querystring: ListMessagesQuery }>) {
    return messagesService.list(request.query, request.authUser!.id);
  }

  async queueSummary(request: FastifyRequest<{ Querystring: QueueSummaryQuery }>) {
    return messagesService.queueSummary(request.query.workspaceId, request.authUser!.id);
  }

  async recent(request: FastifyRequest<{ Querystring: { workspaceId: string } }>) {
    return { activity: await messagesService.recent(request.query.workspaceId, request.authUser!.id) };
  }
}

export const messagesController = new MessagesController();