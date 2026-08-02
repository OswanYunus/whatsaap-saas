import makeWASocket, { DisconnectReason, WASocket, Browsers } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { EventEmitter } from "events";
import qrcode from "qrcode";
import { prisma } from "@waas/database";
import { usePostgresAuthState } from "./baileys-auth-store";
import { logger } from "../../utils/logger";

export const whatsappEvents = new EventEmitter();

// Max listeners to prevent warning logs
whatsappEvents.setMaxListeners(100);

export class WhatsAppManager {
  private sockets = new Map<string, WASocket>();
  private reconnectingInstances = new Set<string>();

  private async safeUpdate(instanceId: string, data: any) {
    try {
      return await prisma.instance.update({
        where: { id: instanceId },
        data,
      });
    } catch (err: any) {
      if (err.code === "P2025") {
        logger.info(`Instance ${instanceId} was deleted, skipping database update.`);
        return null;
      }
      throw err;
    }
  }

  hasActiveSocket(instanceId: string): boolean {
    return this.sockets.has(instanceId);
  }

  getSocket(instanceId: string): WASocket | undefined {
    return this.sockets.get(instanceId);
  }

  async connectInstance(instanceId: string): Promise<WASocket> {
    // If already active, return it
    if (this.sockets.has(instanceId)) {
      return this.sockets.get(instanceId)!;
    }

    logger.info(`Connecting WhatsApp instance ${instanceId}...`);

    const { state, saveCreds } = await usePostgresAuthState(instanceId);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      logger: logger as any,
    });

    this.sockets.set(instanceId, socket);

    socket.ev.on("creds.update", async () => {
      await saveCreds();
    });

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          // Generate QR base64 data URI
          const qrDataUrl = await qrcode.toDataURL(qr);
          await this.safeUpdate(instanceId, {
            qrCodeString: qrDataUrl,
            qrExpiresAt: new Date(Date.now() + 40000), // expires in 40s
            status: "QR_WAITING",
            lastSeenAt: new Date(),
            lastError: null,
          });

          whatsappEvents.emit(`events:${instanceId}`, {
            type: "qr",
            qrCodeString: qrDataUrl,
            qrExpiresAt: new Date(Date.now() + 40000),
            status: "QR_WAITING",
          });
        } catch (err) {
          logger.error(err, "Failed to generate QR data URL");
        }
      }

      if (connection === "connecting") {
        const isReconnecting = this.reconnectingInstances.has(instanceId);
        const status = isReconnecting ? "RECONNECTING" : "CONNECTING";

        await this.safeUpdate(instanceId, {
          status,
          lastSeenAt: new Date(),
        });

        whatsappEvents.emit(`events:${instanceId}`, {
          type: "status",
          status,
        });
      }

      if (connection === "open") {
        this.reconnectingInstances.delete(instanceId);
        const phoneNumber = socket.user?.id.split(":")[0] || socket.user?.id;
        const displayName = socket.user?.name || null;

        await this.safeUpdate(instanceId, {
          status: "CONNECTED",
          phoneNumber,
          displayName,
          qrCodeString: null,
          qrExpiresAt: null,
          pairingCode: null,
          lastSeenAt: new Date(),
          lastError: null,
        });

        whatsappEvents.emit(`events:${instanceId}`, {
          type: "status",
          status: "CONNECTED",
          phoneNumber,
          displayName,
        });
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || "Connection closed";
        
        // Stop infinite reconnect loops for QR timeouts (408) or manual logouts
        const shouldReconnect = 
          statusCode !== DisconnectReason.loggedOut && 
          statusCode !== DisconnectReason.connectionClosed &&
          statusCode !== DisconnectReason.timedOut;

        logger.warn(
          `Connection closed for instance ${instanceId}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`
        );

        if (!shouldReconnect) {
          // Logged out or timed out
          this.reconnectingInstances.delete(instanceId);
          this.sockets.delete(instanceId);

          await this.safeUpdate(instanceId, {
            status: "LOGGED_OUT",
            phoneNumber: null,
            displayName: null,
            qrCodeString: null,
            qrExpiresAt: null,
            pairingCode: null,
            lastSeenAt: new Date(),
            lastError: errorMessage,
          });

          // Clear auth rows
          try {
            await prisma.baileysAuth.deleteMany({ where: { instanceId } });
          } catch (err) {
            logger.error(err, "Failed to clear auth state");
          }

          whatsappEvents.emit(`events:${instanceId}`, {
            type: "status",
            status: "LOGGED_OUT",
            error: errorMessage,
          });
        } else {
          // Reconnect
          this.reconnectingInstances.add(instanceId);
          this.sockets.delete(instanceId);

          await this.safeUpdate(instanceId, {
            status: "RECONNECTING",
            lastSeenAt: new Date(),
            lastError: errorMessage,
          });

          whatsappEvents.emit(`events:${instanceId}`, {
            type: "status",
            status: "RECONNECTING",
            error: errorMessage,
          });

          // Attempt reconnection after 3 seconds
          setTimeout(() => {
            this.connectInstance(instanceId).catch((err) => {
              logger.error(err, `Failed to reconnect instance ${instanceId}`);
            });
          }, 3000);
        }
      }
    });

    return socket;
  }

  async requestPairingCode(instanceId: string, phoneNumber: string): Promise<string> {
    const socket = await this.connectInstance(instanceId);
    
    if (socket.authState.creds.registered) {
      throw new Error("Instance is already registered.");
    }

    const formattedPhone = phoneNumber.replace(/\D/g, "");
    if (!formattedPhone) {
      throw new Error("Invalid phone number format.");
    }

    logger.info(`Requesting pairing code for instance ${instanceId} and phone ${formattedPhone}...`);

    // In Baileys, requestPairingCode should be called after socket initialization
    const code = await socket.requestPairingCode(formattedPhone);

    await this.safeUpdate(instanceId, {
      status: "PAIRING_CODE",
      pairingCode: code,
      phoneNumber: formattedPhone,
      qrCodeString: null,
      qrExpiresAt: null,
      lastSeenAt: new Date(),
      lastError: null,
    });

    whatsappEvents.emit(`events:${instanceId}`, {
      type: "pairing_code",
      pairingCode: code,
      status: "PAIRING_CODE",
      phoneNumber: formattedPhone,
    });

    return code;
  }

  async disconnectInstance(instanceId: string) {
    const socket = this.sockets.get(instanceId);
    this.reconnectingInstances.delete(instanceId);
    this.sockets.delete(instanceId);

    if (socket) {
      try {
        await socket.logout();
      } catch (err) {
        logger.error(err, `Error logging out socket for instance ${instanceId}`);
        socket.end(undefined);
      }
    }

    await this.safeUpdate(instanceId, {
      status: "LOGGED_OUT",
      phoneNumber: null,
      displayName: null,
      qrCodeString: null,
      qrExpiresAt: null,
      pairingCode: null,
      lastSeenAt: new Date(),
    });

    // Clear auth rows
    try {
      await prisma.baileysAuth.deleteMany({ where: { instanceId } });
    } catch (err) {
      logger.error(err, "Failed to clear auth state");
    }

    whatsappEvents.emit(`events:${instanceId}`, {
      type: "status",
      status: "LOGGED_OUT",
    });
  }

  async sendMessage(instanceId: string, to: string, content: string) {
    const socket = this.sockets.get(instanceId);
    if (!socket) {
      throw new Error("WhatsApp instance is not connected.");
    }

    const formattedJid = to.includes("@s.whatsapp.net")
      ? to
      : `${to.replace(/\D/g, "")}@s.whatsapp.net`;

    logger.info(`Sending message to ${formattedJid} via instance ${instanceId}`);
    const result = await socket.sendMessage(formattedJid, { text: content });

    if (!result || !result.key || !result.key.id) {
      throw new Error("Failed to send message via Baileys.");
    }

    await this.safeUpdate(instanceId, {
      lastSeenAt: new Date(),
    });

    return {
      externalMessageId: result.key.id,
      status: "SENT" as const,
    };
  }

  async initialize() {
    logger.info("Initializing active WhatsApp connections...");
    
    // Reset any instances that were stuck waiting for user action when the server stopped
    await prisma.instance.updateMany({
      where: {
        status: {
          in: ["QR_WAITING", "PAIRING_CODE"],
        },
      },
      data: {
        status: "LOGGED_OUT",
        qrCodeString: null,
        qrExpiresAt: null,
        pairingCode: null,
      }
    });

    // Only restore instances that were actually logged in
    const instances = await prisma.instance.findMany({
      where: {
        status: {
          in: ["CONNECTED", "CONNECTING", "RECONNECTING"],
        },
      },
    });

    for (const instance of instances) {
      try {
        await this.connectInstance(instance.id);
      } catch (err) {
        logger.error(err, `Failed to restore connection for instance ${instance.id}`);
      }
    }
  }
}

export const whatsappManager = new WhatsAppManager();
