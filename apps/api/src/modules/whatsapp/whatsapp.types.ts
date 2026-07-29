export type WhatsAppConnectionStatus =
  | "PENDING"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "LOGGED_OUT";

export interface WhatsAppSendResult {
  externalMessageId: string;
  status: "SENT" | "FAILED";
}