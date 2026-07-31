import type { FastifyRequest, FastifyReply } from "fastify";
import { campaignTemplateService } from "./campaign-template.service";
import type {
  CreateCampaignTemplateInput,
  UpdateCampaignTemplateInput,
  ListCampaignTemplatesQuery
} from "./campaign-template.schema";

export class CampaignTemplateController {
  async list(request: FastifyRequest<{ Querystring: ListCampaignTemplatesQuery }>) {
    return campaignTemplateService.list(request.query.workspaceId, request.authUser!.id);
  }

  async get(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignTemplateService.get(request.params.id, request.authUser!.id);
  }

  async create(request: FastifyRequest<{ Body: CreateCampaignTemplateInput }>, reply: FastifyReply) {
    const template = await campaignTemplateService.create(request.body, request.authUser!.id);
    return reply.status(201).send(template);
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateCampaignTemplateInput }>) {
    return campaignTemplateService.update(request.params.id, request.body, request.authUser!.id);
  }

  async remove(request: FastifyRequest<{ Params: { id: string } }>) {
    return campaignTemplateService.delete(request.params.id, request.authUser!.id);
  }
}

export const campaignTemplateController = new CampaignTemplateController();
