/**
 * Static mock data for the dashboard UI.
 *
 * Every page in this scaffold reads from here instead of the API for
 * now. Each export below is named after the real endpoint it should
 * eventually come from (noted in the comment) so wiring up `apiFetch`
 * later is a straight swap, not a rewrite.
 */

export type InstanceStatus = "connected" | "connecting" | "disconnected" | "logged_out";
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed" | "failed";
export type MessageStatus = "queued" | "processing" | "sent" | "failed";

// GET /api/dashboard/summary
export const dashboardSummary = {
  activeInstances: 4,
  messagesSentToday: 2318,
  messagesQueued: 146,
  deliveryRate: 97.4,
  failedMessages: 23
};

// GET /api/whatsapp/instances
export interface WhatsAppInstanceRow {
  id: string;
  businessPhone: string;
  label: string;
  status: InstanceStatus;
  connectedSince: string | null;
  messagesSent: number;
}

export const whatsappInstances: WhatsAppInstanceRow[] = [
  { id: "wa_1", businessPhone: "+254 712 345 678", label: "Sales Line", status: "connected", connectedSince: "2026-07-12", messagesSent: 8420 },
  { id: "wa_2", businessPhone: "+254 733 890 221", label: "Support Line", status: "connected", connectedSince: "2026-07-18", messagesSent: 5103 },
  { id: "wa_3", businessPhone: "+254 701 556 903", label: "Marketing", status: "connecting", connectedSince: null, messagesSent: 0 },
  { id: "wa_4", businessPhone: "+254 720 114 887", label: "Backup Line", status: "disconnected", connectedSince: "2026-06-02", messagesSent: 1244 }
];

// GET /api/campaigns
export interface CampaignRow {
  id: string;
  name: string;
  recipients: number;
  status: CampaignStatus;
  createdAt: string;
  progress: number; // 0-100
}

export const campaigns: CampaignRow[] = [
  { id: "cmp_1", name: "July Restock Announcement", recipients: 1840, status: "running", createdAt: "2026-07-27", progress: 62 },
  { id: "cmp_2", name: "Loyalty Members Discount", recipients: 640, status: "completed", createdAt: "2026-07-22", progress: 100 },
  { id: "cmp_3", name: "New Branch Opening — Likoni", recipients: 2210, status: "scheduled", createdAt: "2026-07-29", progress: 0 },
  { id: "cmp_4", name: "Abandoned Cart Reminder", recipients: 390, status: "paused", createdAt: "2026-07-25", progress: 34 },
  { id: "cmp_5", name: "Weekend Flash Sale", recipients: 1120, status: "failed", createdAt: "2026-07-20", progress: 18 }
];

// GET /api/contacts
export interface ContactRow {
  id: string;
  name: string;
  phone: string;
  group: string;
  addedAt: string;
}

export const contacts: ContactRow[] = [
  { id: "c_1", name: "Amina Wanjiru", phone: "+254 712 000 111", group: "VIP", addedAt: "2026-05-11" },
  { id: "c_2", name: "Brian Otieno", phone: "+254 733 222 333", group: "General", addedAt: "2026-05-14" },
  { id: "c_3", name: "Catherine Mwikali", phone: "+254 701 444 555", group: "Wholesale", addedAt: "2026-06-02" },
  { id: "c_4", name: "Dennis Kiptoo", phone: "+254 720 666 777", group: "General", addedAt: "2026-06-19" },
  { id: "c_5", name: "Esther Chebet", phone: "+254 715 888 999", group: "VIP", addedAt: "2026-07-01" }
];

export const contactGroups = ["All", "VIP", "General", "Wholesale"];

// GET /api/campaigns/recent
export const recentCampaigns = campaigns.slice(0, 3);

// GET /api/activity/recent
export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
}

export const recentActivity: ActivityItem[] = [
  { id: "a_1", message: "Campaign \"July Restock Announcement\" reached 60% delivery", timestamp: "6 min ago" },
  { id: "a_2", message: "WhatsApp instance \"Marketing\" is reconnecting", timestamp: "18 min ago" },
  { id: "a_3", message: "142 contacts imported from contacts_july.csv", timestamp: "1 hr ago" },
  { id: "a_4", message: "Campaign \"Weekend Flash Sale\" failed — instance disconnected", timestamp: "3 hr ago" }
];

// GET /api/queue/health
export const queueHealth = {
  queued: 146,
  processing: 12,
  throughputPerMinute: 38,
  oldestJobAgeSeconds: 94
};

// GET /api/queue/messages (grouped by status, for the Queue Monitor board)
export interface QueueMessage {
  id: string;
  contact: string;
  campaign: string;
  status: MessageStatus;
}

export const queueMessages: QueueMessage[] = [
  { id: "m_1", contact: "+254 712 000 111", campaign: "July Restock Announcement", status: "queued" },
  { id: "m_2", contact: "+254 733 222 333", campaign: "July Restock Announcement", status: "queued" },
  { id: "m_3", contact: "+254 701 444 555", campaign: "July Restock Announcement", status: "processing" },
  { id: "m_4", contact: "+254 720 666 777", campaign: "Abandoned Cart Reminder", status: "sent" },
  { id: "m_5", contact: "+254 715 888 999", campaign: "Loyalty Members Discount", status: "sent" },
  { id: "m_6", contact: "+254 733 900 112", campaign: "Weekend Flash Sale", status: "failed" }
];

// GET /api/analytics/messages-over-time
export const messagesOverTime = [
  { date: "Jul 23", sent: 1820, delivered: 1780, failed: 40 },
  { date: "Jul 24", sent: 2040, delivered: 1990, failed: 50 },
  { date: "Jul 25", sent: 1650, delivered: 1610, failed: 40 },
  { date: "Jul 26", sent: 2210, delivered: 2140, failed: 70 },
  { date: "Jul 27", sent: 2480, delivered: 2410, failed: 70 },
  { date: "Jul 28", sent: 2390, delivered: 2330, failed: 60 },
  { date: "Jul 29", sent: 2318, delivered: 2258, failed: 60 }
];

// GET /api/analytics/failure-reasons
export const failureReasons = [
  { reason: "Invalid number", count: 38 },
  { reason: "Instance disconnected", count: 24 },
  { reason: "Rate limited", count: 16 },
  { reason: "Opted out", count: 9 },
  { reason: "Unknown error", count: 5 }
];

// GET /api/analytics/campaign-activity
export const mostActiveCampaigns = [
  { name: "July Restock Announcement", messages: 1840 },
  { name: "New Branch Opening — Likoni", messages: 2210 },
  { name: "Weekend Flash Sale", messages: 1120 },
  { name: "Loyalty Members Discount", messages: 640 }
];

// GET /api/workspace
export const workspace = {
  id: "ws_1",
  name: "Musi's Collection",
  plan: "Growth",
  members: [
    { id: "u_1", name: "Oswan Mwangale", email: "oswan@example.com", role: "Owner" },
    { id: "u_2", name: "Grace Achieng", email: "grace@example.com", role: "Admin" },
    { id: "u_3", name: "Peter Kamau", email: "peter@example.com", role: "Member" }
  ]
};

// GET /api/workspace/api-keys
export const apiKeys = [
  { id: "key_1", label: "Production", createdAt: "2026-06-01", lastUsed: "2 hr ago" },
  { id: "key_2", label: "Staging", createdAt: "2026-06-15", lastUsed: "5 days ago" }
];