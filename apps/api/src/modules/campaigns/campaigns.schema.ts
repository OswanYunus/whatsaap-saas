import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");

const createCampaignBase = z.object({
  workspaceId: cuid,
  instanceId: cuid,
  name: z.string().min(1).max(120),
  messageTemplate: z.string().min(1).max(4096),
  notes: z.string().max(500).optional().nullable(),
  
  audienceType: z.enum(["ALL", "GROUP", "TAGS", "MANUAL"]).default("ALL"),
  audienceGroupName: z.string().max(60).optional().nullable(),
  audienceTags: z.array(z.string()).optional(),
  contactIds: z.array(cuid).optional(),

  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  isRecurring: z.boolean().default(false),
  cronExpression: z.string().max(100).optional().nullable(),

  minDelaySeconds: z.coerce.number().int().min(1).max(120).default(4),
  maxDelaySeconds: z.coerce.number().int().min(1).max(120).default(9),
  maxPerMinute: z.coerce.number().int().min(1).max(1000).default(12),
  footerEnabled: z.boolean().default(true)
});

export const createCampaignSchema = createCampaignBase.superRefine((data, ctx) => {
  // Validate audience constraints
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
  if (data.audienceType === "MANUAL" && (!data.contactIds || data.contactIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one contact ID is required when audienceType is MANUAL",
      path: ["contactIds"]
    });
  }

  // Validate recurrence constraints
  if (data.isRecurring && !data.cronExpression) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "cronExpression is required for recurring campaigns",
      path: ["cronExpression"]
    });
  }

  // Validate delay constraints
  if (data.minDelaySeconds > data.maxDelaySeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "minDelaySeconds cannot be greater than maxDelaySeconds",
      path: ["minDelaySeconds"]
    });
  }
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignBase.partial().omit({
  workspaceId: true,
  instanceId: true
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const updateCampaignStatusSchema = z.object({
  status: z.enum(["RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"])
});
export type UpdateCampaignStatusInput = z.infer<typeof updateCampaignStatusSchema>;

export const listCampaignsQuerySchema = z.object({
  workspaceId: cuid
});
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;

export const audiencePreviewSchema = z.object({
  workspaceId: cuid,
  audienceType: z.enum(["ALL", "GROUP", "TAGS", "MANUAL"]),
  audienceGroupName: z.string().optional().nullable(),
  audienceTags: z.string().transform(val => val.split(",").map(t => t.trim()).filter(Boolean)).optional(),
  contactIds: z.string().transform(val => val.split(",").map(t => t.trim()).filter(Boolean)).optional()
});
export type AudiencePreviewQuery = z.infer<typeof audiencePreviewSchema>;