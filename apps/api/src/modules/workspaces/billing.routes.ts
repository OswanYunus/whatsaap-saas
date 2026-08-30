import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@waas/database";
import { workspacesService } from "./workspaces.service";

const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PREMIUM", "PRO"]),
  phoneNumber: z.string().min(10).max(15)
});

export default async function billingRoutes(fastify: FastifyInstance) {
  // 1. Get workspace billing info
  fastify.get("/workspaces/:id/billing", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      await workspacesService.assertMembership(id, request.authUser!.id);
      
      const billing = await workspacesService.checkBilling(id, request.authUser!.id);
      const activeInstancesCount = await prisma.instance.count({
        where: { workspaceId: id }
      });

      return {
        plan: billing.plan,
        subscriptionExpiresAt: billing.subscriptionExpiresAt,
        activeInstancesCount,
        activeInstancesLimit: billing.maxInstances,
        allowImages: billing.allowImages,
        expired: billing.expired
      };
    }
  });

  // 2. Mock STK Push Checkout
  fastify.post("/workspaces/:id/billing/checkout", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plan, phoneNumber: _phoneNumber } = checkoutSchema.parse(request.body);
      await workspacesService.assertMembership(id, request.authUser!.id);

      // Simulate a small delay for STK Push processing
      await new Promise(r => setTimeout(r, 1200));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

      // Update workspace subscription in db
      await prisma.workspace.update({
        where: { id },
        data: {
          plan,
          subscriptionExpiresAt: expiresAt
        }
      });

      return {
        success: true,
        message: `Ksh ${plan === "BASIC" ? 500 : plan === "PREMIUM" ? 1000 : 1500} payment successful! M-Pesa Transaction ID: MP${Math.random().toString(36).substring(2, 10).toUpperCase()}. Package ${plan} is active.`,
        plan,
        subscriptionExpiresAt: expiresAt
      };
    }
  });

  // 3. Cancel/Revert subscription
  fastify.post("/workspaces/:id/billing/cancel", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      await workspacesService.assertMembership(id, request.authUser!.id);

      await prisma.workspace.update({
        where: { id },
        data: {
          plan: "FREE",
          subscriptionExpiresAt: null
        }
      });

      return {
        success: true,
        message: "Subscription canceled successfully."
      };
    }
  });
}
