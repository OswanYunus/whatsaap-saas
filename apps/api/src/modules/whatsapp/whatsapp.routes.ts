import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@waas/database";
import { whatsappService } from "./whatsapp.service";
import { workspacesService } from "../workspaces/workspaces.service";
import { whatsappManager, whatsappEvents } from "./whatsapp.manager";
import { env } from "@waas/config";

const createInstanceSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1).max(100)
});

const pairingCodeSchema = z.object({
  phoneNumber: z.string().min(8).max(20)
});

const sendInternalSchema = z.object({
  to: z.string(),
  content: z.string()
});

export default async function whatsappRoutes(fastify: FastifyInstance) {
  // 1. List instances
  fastify.get("/whatsapp/instances", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const workspaceId = (request.query as any).workspaceId as string;
      if (!workspaceId) {
        throw fastify.httpErrors.badRequest("workspaceId is required");
      }
      await workspacesService.assertMembership(workspaceId, request.authUser!.id);
      return whatsappService.listInstances(workspaceId);
    }
  });

  // 2. Create instance
  fastify.post("/whatsapp/instances", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const { workspaceId, name } = createInstanceSchema.parse(request.body);
      await workspacesService.assertMembership(workspaceId, request.authUser!.id);
      const instance = await whatsappService.createInstance(workspaceId, name);
      return reply.status(201).send(instance);
    }
  });

  // 3. Delete/disconnect instance
  fastify.delete("/whatsapp/instances/:id", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const instance = await prisma.instance.findUniqueOrThrow({ where: { id } });
      await workspacesService.assertMembership(instance.workspaceId, request.authUser!.id);
      return whatsappService.deleteInstance(id);
    }
  });

  // 4. Get instance status
  fastify.get("/whatsapp/instances/:id/status", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const instance = await prisma.instance.findUniqueOrThrow({ where: { id } });
      await workspacesService.assertMembership(instance.workspaceId, request.authUser!.id);
      return whatsappService.getStatus(id);
    }
  });

  // 5. Request phone pairing code
  fastify.post("/whatsapp/instances/:id/pairing-code", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const { phoneNumber } = pairingCodeSchema.parse(request.body);
      const instance = await prisma.instance.findUniqueOrThrow({ where: { id } });
      await workspacesService.assertMembership(instance.workspaceId, request.authUser!.id);
      
      const code = await whatsappManager.requestPairingCode(id, phoneNumber);
      return { code };
    }
  });

  // 6. Manually reconnect/refresh
  fastify.post("/whatsapp/instances/:id/reconnect", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const instance = await prisma.instance.findUniqueOrThrow({ where: { id } });
      await workspacesService.assertMembership(instance.workspaceId, request.authUser!.id);
      
      // Force reconnect
      await whatsappManager.disconnectInstance(id);
      await whatsappManager.connectInstance(id);
      return { success: true };
    }
  });

  // 7. SSE Events endpoint (live status/QR updates)
  fastify.get("/whatsapp/instances/:id/events", {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const token = (request.query as any).token || request.headers.authorization?.split(" ")[1];
      
      if (!token) {
        return reply.code(401).send({ error: "Missing authentication token" });
      }

      let userId: string;
      try {
        const decoded = fastify.jwt.verify(token) as any;
        userId = decoded.sub;
      } catch (err) {
        return reply.code(401).send({ error: "Invalid authentication token" });
      }

      const instance = await prisma.instance.findUnique({ where: { id } });
      if (!instance) {
        return reply.code(404).send({ error: "Instance not found" });
      }

      try {
        await workspacesService.assertMembership(instance.workspaceId, userId);
      } catch {
        return reply.code(403).send({ error: "Access denied" });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });

      // Send initial status immediately upon connection
      const currentStatus = {
        type: "status",
        status: instance.status,
        phoneNumber: instance.phoneNumber,
        displayName: instance.displayName,
        qrCodeString: instance.qrCodeString,
        pairingCode: instance.pairingCode,
        qrExpiresAt: instance.qrExpiresAt
      };
      reply.raw.write(`data: ${JSON.stringify(currentStatus)}\n\n`);

      const listener = (event: any) => {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      whatsappEvents.on(`events:${id}`, listener);

      request.raw.on("close", () => {
        whatsappEvents.off(`events:${id}`, listener);
      });
    }
  });

  // 8. Internal send endpoint for queue workers
  fastify.post("/whatsapp/instances/:id/send-internal", {
    handler: async (request, reply) => {
      const internalToken = request.headers["x-internal-token"];
      if (internalToken !== env.JWT_ACCESS_SECRET) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const { to, content } = sendInternalSchema.parse(request.body);

      try {
        const result = await whatsappManager.sendMessage(id, to, content);
        return result;
      } catch (err) {
        return reply.code(500).send({ error: (err as Error).message });
      }
    }
  });
}