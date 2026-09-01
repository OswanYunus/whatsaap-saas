import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@waas/database";
import { workspacesService } from "./workspaces.service";
import { AppError } from "../../plugins/error-handler";

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
        activeInstances: activeInstancesCount,
        activeInstancesCount,
        activeInstancesLimit: billing.maxInstances,
        allowImages: billing.allowImages,
        expired: billing.expired,
        subscriptionCancelAt: billing.subscriptionCancelAt
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

      const mpesaConfigured = Boolean(
        process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY &&
        process.env.MPESA_CALLBACK_URL
      );

      if (!mpesaConfigured) {
        throw new AppError(
          "M-Pesa checkout is not configured yet. Package activation requires confirmed STK payment.",
          503,
          "MPESA_NOT_CONFIGURED"
        );
      }

      return {
        success: false,
        status: "PENDING",
        message: "STK Push requested. Your package will activate after M-Pesa confirms payment.",
        plan
      };
    }
  });

  // 3. Cancel renewal at the end of the current billing period
  fastify.post("/workspaces/:id/billing/cancel", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      await workspacesService.assertMembership(id, request.authUser!.id);

      const workspace = await prisma.workspace.findUnique({ where: { id } });
      if (!workspace) {
        throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
      }

      await prisma.workspace.update({
        where: { id },
        data: {
          subscriptionCancelAt: workspace.subscriptionExpiresAt ?? new Date()
        }
      });

      const billing = await workspacesService.checkBilling(id, request.authUser!.id);
      const activeInstancesCount = await prisma.instance.count({
        where: { workspaceId: id }
      });

      return {
        success: true,
        message: "Subscription renewal canceled. Access remains active until the current package expires.",
        plan: billing.plan,
        subscriptionExpiresAt: billing.subscriptionExpiresAt,
        activeInstances: activeInstancesCount,
        activeInstancesCount,
        activeInstancesLimit: billing.maxInstances,
        allowImages: billing.allowImages,
        expired: billing.expired,
        subscriptionCancelAt: workspace.subscriptionExpiresAt
      };
    }
  });
}
