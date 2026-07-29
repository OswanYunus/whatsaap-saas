import type { FastifyRequest, FastifyReply } from "fastify";
import { campaignsService } from "./campaigns.service";
import type {
  CreateCampaignInput,
  UpdateCampaignStatusInput,
  ListCampaignsQuery
} from "./campaigns.schema";

export class CampaignsController {
  async list(request: FastifyRequest<{ Querystring: ListCampaignsQuery }>) {
    return campaignsService.list(request.query.workspaceId, request.authUser!.id);
  }

  async create(request: FastifyRequest<{ Body: CreateCampaignInput }>, reply: FastifyReply) {
    const campaign = await campaignsService.create(request.body, request.authUser!.id);
    return reply.status(201).send(campaign);
  }

  async updateStatus(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCampaignStatusInput }>
  ) {
    return campaignsService.updateStatus(request.params.id, request.body, request.authUser!.id);
  }

  async remove(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignsService.delete(request.params.id, request.authUser!.id);
  }
}

export const campaignsController = new CampaignsController();