import type { FastifyRequest, FastifyReply } from "fastify";
import { apiKeysService } from "./api-keys.service";
import type { CreateApiKeyInput, ListApiKeysQuery } from "./api-keys.schema";

export class ApiKeysController {
  async list(request: FastifyRequest<{ Querystring: ListApiKeysQuery }>) {
    return { keys: await apiKeysService.list(request.query.workspaceId, request.authUser!.id) };
  }

  async create(request: FastifyRequest<{ Body: CreateApiKeyInput }>, reply: FastifyReply) {
    const key = await apiKeysService.create(request.body, request.authUser!.id);
    return reply.status(201).send(key);
  }

  async revoke(request: FastifyRequest<{ Params: { id: string } }>) {
    return apiKeysService.revoke(request.params.id, request.authUser!.id);
  }
}

export const apiKeysController = new ApiKeysController();