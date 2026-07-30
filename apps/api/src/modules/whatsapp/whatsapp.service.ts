import { prisma } from "@waas/database";
import { env } from "@waas/config";
import type { WhatsAppSendResult } from "./whatsapp.types";
import { whatsappManager } from "./whatsapp.manager";
import { logger } from "../../utils/logger";

export class WhatsAppService {
  async createInstance(workspaceId: string, name: string) {
    const instance = await prisma.instance.create({
      data: {
        workspaceId,
        name,
        status: "PENDING"
      }
    });

    // Boot the socket connection immediately so it can start generating a QR code
    whatsappManager.connectInstance(instance.id).catch((err) => {
      logger.error(err, `Failed to boot instance ${instance.id} on creation`);
    });

    return instance;
  }

  async listInstances(workspaceId: string) {
    return prisma.instance.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });
  }

  async deleteInstance(instanceId: string) {
    // Shutdown and clear credentials
    await whatsappManager.disconnectInstance(instanceId);
    
    // Delete from DB
    await prisma.instance.delete({
      where: { id: instanceId }
    });

    return { id: instanceId, deleted: true };
  }

  async getStatus(instanceId: string) {
    return prisma.instance.findUniqueOrThrow({
      where: { id: instanceId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        displayName: true,
        status: true,
        qrCodeString: true,
        pairingCode: true,
        qrExpiresAt: true,
        lastSeenAt: true,
        lastError: true
      }
    });
  }

  async sendMessage(instanceId: string, to: string, content: string): Promise<WhatsAppSendResult> {
    // If the socket is active in the current memory workspace (API process)
    if (whatsappManager.hasActiveSocket(instanceId)) {
      return whatsappManager.sendMessage(instanceId, to, content);
    }

    // Otherwise, we are in a worker process! Forward the request to the main API process
    logger.info(`Forwarding send request for instance ${instanceId} from worker process to API server`);
    
    const host = env.API_HOST === "0.0.0.0" ? "localhost" : env.API_HOST;
    const url = `http://${host}:${env.API_PORT}/api/whatsapp/instances/${instanceId}/send-internal`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": env.JWT_ACCESS_SECRET
        },
        body: JSON.stringify({ to, content })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as any;
        throw new Error(body?.error || `Internal API returned status ${response.status}`);
      }

      const result = await response.json() as WhatsAppSendResult;
      return result;
    } catch (err) {
      logger.error(err, `Failed to dispatch message internally to API for instance ${instanceId}`);
      return {
        externalMessageId: "",
        status: "FAILED"
      };
    }
  }
}

export const whatsappService = new WhatsAppService();