import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@waas/database";
import { whatsappManager } from "../whatsapp/whatsapp.manager";
import { AppError } from "../../plugins/error-handler";

const sendSchema = z.object({
  to: z
    .string()
    .min(7, "Phone number too short")
    .transform((v) => {
      // Normalise: strip non-digits, handle leading 0
      let clean = v.replace(/\D/g, "");
      if (clean.startsWith("0")) clean = "254" + clean.slice(1);
      return clean;
    }),
  message: z.string().min(1, "Message cannot be empty").max(4096),
  // Optional — if omitted we pick the first CONNECTED instance in the workspace
  instanceId: z.string().cuid().optional()
});

/**
 * POST /api/v1/send
 *
 * Public-facing endpoint authenticated via workspace API key.
 * Designed for external apps (e.g. a client's cPanel PHP app) that
 * want to send a single WhatsApp message without using the Cerebro UI.
 *
 * Auth: Authorization: Bearer wak_xxx
 *
 * Body:
 * {
 *   "to": "254712345678",       // or "0712345678" — auto-normalised
 *   "message": "Hello world!",
 *   "instanceId": "..."         // optional
 * }
 */
export default async function publicSendRoutes(fastify: FastifyInstance) {
  fastify.post("/v1/send", {
    preHandler: [fastify.authenticateApiKey],
    handler: async (request, reply) => {
      const workspaceId = request.apiWorkspaceId!;

      // Parse + validate body
      const parsed = sendSchema.safeParse(request.body);
      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Invalid request body";
        throw new AppError(message, 400, "VALIDATION_ERROR");
      }

      const { to, message, instanceId } = parsed.data;

      // Resolve which instance to use
      let instance;
      if (instanceId) {
        instance = await prisma.instance.findFirst({
          where: { id: instanceId, workspaceId, status: "CONNECTED" }
        });
        if (!instance) {
          throw new AppError(
            "Instance not found or not connected",
            404,
            "INSTANCE_NOT_FOUND"
          );
        }
      } else {
        // Auto-pick first connected instance in this workspace
        instance = await prisma.instance.findFirst({
          where: { workspaceId, status: "CONNECTED" }
        });
        if (!instance) {
          throw new AppError(
            "No connected WhatsApp instance found in this workspace",
            503,
            "NO_CONNECTED_INSTANCE"
          );
        }
      }

      // Send via WhatsApp manager (same path used by campaign workers)
      const sock = whatsappManager.getSocket(instance.id);
      if (!sock) {
        throw new AppError(
          "WhatsApp instance is not ready. Try again shortly.",
          503,
          "INSTANCE_NOT_READY"
        );
      }

      const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

      try {
        await sock.sendMessage(jid, { text: message });
      } catch (err: any) {
        throw new AppError(
          `WhatsApp send failed: ${err?.message ?? "unknown error"}`,
          502,
          "SEND_FAILED"
        );
      }

      // Record in messages table for analytics
      await prisma.message.create({
        data: {
          instanceId: instance.id,
          to,
          body: message,
          status: "SENT",
          sentAt: new Date()
        }
      });

      return reply.status(200).send({
        ok: true,
        to,
        instanceId: instance.id
      });
    }
  });
}
