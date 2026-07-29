import { prisma } from "@waas/database";
import type { WhatsAppSendResult } from "./whatsapp.types";

/**
 * Abstraction boundary around the Baileys WhatsApp Web library.
 *
 * IMPORTANT: this is intentionally a placeholder. No Baileys socket is
 * created here yet. The goal of this class is to define the *contract*
 * the rest of the app (queue workers, routes) will program against, so
 * that:
 *   1. The messaging implementation can be built and tested in isolation.
 *   2. Baileys could be swapped for another WhatsApp Cloud API provider
 *      later without touching call sites outside this file.
 *
 * Planned responsibilities once implemented:
 *   - createInstance(workspaceId): initialize a Baileys auth state,
 *     open a socket, and persist QR/connection events to the
 *     WhatsAppInstance row (status + encrypted sessionData).
 *   - restoreInstance(instanceId): rehydrate a socket from stored
 *     session data on API/worker startup.
 *   - sendMessage(instanceId, to, content): send a message and return
 *     the provider's message id for delivery-log correlation.
 *   - handleIncomingEvents(instanceId): subscribe to Baileys
 *     connection.update / messages.upsert events and update
 *     WhatsAppInstance / Message rows accordingly.
 */
export class WhatsAppService {
  async createInstance(workspaceId: string, name: string) {
    // TODO: initialize Baileys multi-file auth state and socket.
    return prisma.instance.create({
      data: {
        workspaceId,
        name,
        status: "PENDING"
      }
    });
  }

  async getStatus(instanceId: string) {
    return prisma.instance.findUniqueOrThrow({
      where: { id: instanceId },
      select: { id: true, status: true, name: true }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendMessage(_instanceId: string, _to: string, _content: string): Promise<WhatsAppSendResult> {
    throw new Error(
      "WhatsAppService.sendMessage is not implemented yet. " +
        "This is a contract placeholder pending Baileys integration."
    );
  }
}

export const whatsappService = new WhatsAppService();