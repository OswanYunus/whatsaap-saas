import { z } from "zod";

const cuid = z.string().cuid("Must be a valid id");
const recipient = z.string().min(7).max(20).transform((value) => {
  let clean = value.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = `254${clean.slice(1)}`;
  return clean;
});

const audienceSchema = z.object({
  type: z.enum(["ALL", "GROUP", "TAGS", "MANUAL"]).default("ALL"),
  groupName: z.string().max(60).optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).optional(),
  contactIds: z.array(cuid).optional()
}).optional();

export const developerSendMessageSchema = z.object({
  recipient,
  message: z.string().min(1).max(4096),
  instanceId: cuid.optional()
});

export const developerScheduleMessageSchema = developerSendMessageSchema.extend({
  scheduledAt: z.string().datetime()
});

export const developerCreateCampaignSchema = z.object({
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(4096),
  instanceId: cuid.optional(),
  audience: audienceSchema,
  scheduledAt: z.string().datetime().optional().nullable(),
  recurring: z.object({
    cronExpression: z.string().min(1).max(100),
    timezone: z.string().max(100).default("UTC")
  }).optional(),
  minDelaySeconds: z.coerce.number().int().min(1).max(120).default(4),
  maxDelaySeconds: z.coerce.number().int().min(1).max(120).default(9),
  maxPerMinute: z.coerce.number().int().min(1).max(1000).default(12),
  footerEnabled: z.boolean().default(true)
}).superRefine((data, ctx) => {
  if (data.minDelaySeconds > data.maxDelaySeconds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "minDelaySeconds cannot be greater than maxDelaySeconds",
      path: ["minDelaySeconds"]
    });
  }
});

export type DeveloperSendMessageInput = z.infer<typeof developerSendMessageSchema>;
export type DeveloperScheduleMessageInput = z.infer<typeof developerScheduleMessageSchema>;
export type DeveloperCreateCampaignInput = z.infer<typeof developerCreateCampaignSchema>;
