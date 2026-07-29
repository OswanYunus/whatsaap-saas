/**
 * Types shared between the API and the web dashboard.
 * Keep this package framework-agnostic (no Fastify/React/Prisma imports)
 * so it can be consumed from both sides of the monorepo safely.
 */

export type WhatsAppInstanceStatus =
  | "PENDING"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "LOGGED_OUT";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "COMPLETED" | "FAILED";

export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
}

export interface WhatsAppInstanceSummary {
  id: string;
  name: string;
  status: WhatsAppInstanceStatus;
  createdAt: string;
}

export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}