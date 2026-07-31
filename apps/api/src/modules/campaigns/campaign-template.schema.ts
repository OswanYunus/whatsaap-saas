import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

const createCampaignTemplateBase = z.object({
  workspaceId: cuid,
  instanceId: cuid,
  name: z.string().min(1).max(120),
  notes: z.string().max(500).optional().nullable(),
  messageTemplate: z.string().min(1).max(4096),
  
  audienceType: z.enum(["ALL", "GROUP", "TAGS", "MANUAL"]).default("ALL"),
  audienceGroupName: z.string().max(60).optional().nullable(),
  audienceTags: z.array(z.string()).optional(),

  isActive: z.boolean().default(true),
  cronExpression: z.string().max(100),
  timezone: z.string().max(100).default("UTC"),

  minDelaySeconds: z.coerce.number().int().min(1).max(120).default(4),
  maxDelaySeconds: z.coerce.number().int().min(1).max(120).default(9),
  maxPerMinute: z.coerce.number().int().min(1).max(1000).default(12),
  footerEnabled: z.boolean().default(true)
});

export const createCampaignTemplateSchema = createCampaignTemplateBase.superRefine((data, ctx) => {
  if (data.audienceType === "GROUP" && !data.audienceGroupName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "groupName is required when audienceType is GROUP",
      path: ["audienceGroupName"]
    });
  }
  if (data.audienceType === "TAGS" && (!data.audienceTags || data.audienceTags.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one tag is required when audienceType is TAGS",
      path: ["audienceTags"]
    });
  }
  if (data.minDelaySeconds > data.maxDelaySeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "minDelaySeconds cannot be greater than maxDelaySeconds",
      path: ["minDelaySeconds"]
    });
  }
});

export type CreateCampaignTemplateInput = z.infer<typeof createCampaignTemplateSchema>;

export const updateCampaignTemplateSchema = createCampaignTemplateBase.partial().omit({
  workspaceId: true,
  instanceId: true
});

export type UpdateCampaignTemplateInput = z.infer<typeof updateCampaignTemplateSchema>;

export const listCampaignTemplatesQuerySchema = z.object({
  workspaceId: cuid
});
export type ListCampaignTemplatesQuery = z.infer<typeof listCampaignTemplatesQuerySchema>;
