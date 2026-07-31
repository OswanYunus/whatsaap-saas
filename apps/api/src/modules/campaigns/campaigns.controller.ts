import type { FastifyRequest, FastifyReply } from "fastify";
import { campaignsService } from "./campaigns.service";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
  ListCampaignsQuery,
  AudiencePreviewQuery
} from "./campaigns.schema";

export class CampaignsController {
  async list(request: FastifyRequest<{ Querystring: ListCampaignsQuery }>) {
    return campaignsService.list(request.query.workspaceId, request.authUser!.id);
  }

  async get(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignsService.get(request.params.id, request.authUser!.id);
  }

  async audiencePreview(request: FastifyRequest<{ Querystring: AudiencePreviewQuery }>) {
    return campaignsService.audiencePreview(request.query, request.authUser!.id);
  }

  async create(request: FastifyRequest<{ Body: CreateCampaignInput }>, reply: FastifyReply) {
    const campaign = await campaignsService.create(request.body, request.authUser!.id);
    return reply.status(211).send(campaign);
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateCampaignInput }>) {
    return campaignsService.update(request.params.id, request.body, request.authUser!.id);
  }

  async updateStatus(request: FastifyRequest<{ Params: { id: string }; Body: UpdateCampaignStatusInput }>) {
    return campaignsService.updateStatus(request.params.id, request.body.status, request.authUser!.id);
  }

  async remove(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignsService.delete(request.params.id, request.authUser!.id);
  }

  async dispatch(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignsService.dispatch(request.params.id, request.authUser!.id);
  }

  async getAnalytics(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignsService.getAnalytics(request.params.id, request.authUser!.id);
  }
}

export const campaignsController = new CampaignsController();