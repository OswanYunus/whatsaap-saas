import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@waas/database";
import { workspacesService } from "./workspaces.service";
import { AppError } from "../../plugins/error-handler";

const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PREMIUM", "PRO"]),
  phoneNumber: z.string().min(10).max(15)
});

const PLAN_PRICES = {
  BASIC: 1,
  PREMIUM: 1,
  PRO: 1
} as const;

function normalizePhone(value: string) {
  let clean = value.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = `254${clean.slice(1)}`;
  if (clean.startsWith("7") && clean.length === 9) clean = `254${clean}`;
  return clean;
}

// ─── Tuma token cache ────────────────────────────────────────────────────────
let tumaTokenCache: { token: string; expiresAt: number } | null = null;

function tumaConfig() {
  const email = process.env.TUMA_EMAIL;
  const apiKey = process.env.TUMA_API_KEY;
  const callbackUrl = process.env.TUMA_CALLBACK_URL || "https://api.cerebro.tukonectdigital.co.ke/api/billing/tuma/callback";

  if (!email || !apiKey) {
    throw new AppError(
      "Payment checkout is not configured yet. Contact support.",
      503,
      "TUMA_NOT_CONFIGURED",
      { missing: [...(!email ? ["TUMA_EMAIL"] : []), ...(!apiKey ? ["TUMA_API_KEY"] : [])] }
    );
  }

  return { email, apiKey, callbackUrl };
}

async function getTumaToken(): Promise<string> {
  const now = Date.now();
  if (tumaTokenCache && tumaTokenCache.expiresAt > now + 60_000) {
    return tumaTokenCache.token;
  }

  const config = tumaConfig();
  const response = await fetch("https://api.tuma.co.ke/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, api_key: config.apiKey })
  });

  const data = await response.json() as Record<string, unknown>;

  // Tuma may return token at root or nested inside data/token fields
  const token =
    (data.token as string | undefined) ||
    ((data.data as Record<string, unknown> | undefined)?.token as string | undefined) ||
    (data.access_token as string | undefined);

  if (!token) {
    throw new AppError(
      (data.message as string) || "Could not authenticate with payment provider.",
      502,
      "TUMA_AUTH_FAILED"
    );
  }

  const expiresIn = ((data.expires_in as number | undefined) ?? 86400) * 1000;
  tumaTokenCache = { token, expiresAt: now + expiresIn };
  return token;
}

// ─── Routes ──────────────────────────────────────────────────────────────────
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

  // 2. Initiate Tuma STK Push checkout
  fastify.post("/workspaces/:id/billing/checkout", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const { plan, phoneNumber } = checkoutSchema.parse(request.body);
      await workspacesService.assertMembership(id, request.authUser!.id);

      const config = tumaConfig();
      const phone = normalizePhone(phoneNumber);
      if (!/^2547\d{8}$/.test(phone)) {
        throw new AppError("Enter a valid Safaricom phone number.", 400, "INVALID_PHONE_NUMBER");
      }

      const amount = PLAN_PRICES[plan];
      const description = `Cerebro ${plan} package`;

      // Record the payment attempt before hitting Tuma
      const payment = await prisma.mpesaPayment.create({
        data: {
          workspaceId: id,
          userId: request.authUser!.id,
          plan,
          amount,
          phoneNumber: phone,
          rawRequest: { phone, amount, plan, description }
        }
      });

      let token: string;
      try {
        token = await getTumaToken();
      } catch (err) {
        await prisma.mpesaPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED", resultDescription: "Payment provider auth failed" }
        });
        throw err;
      }

      const tumaResponse = await fetch("https://api.tuma.co.ke/payment/stk-push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          phone,
          callback_url: config.callbackUrl,
          description
        })
      });

      const data = await tumaResponse.json() as {
        success?: boolean;
        message?: string;
        data?: {
          merchant_request_id?: string;
          checkout_request_id?: string;
          customer_message?: string;
        };
      };

      const stkData = data.data;

      await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          merchantRequestId: stkData?.merchant_request_id ?? null,
          checkoutRequestId: stkData?.checkout_request_id ?? null,
          customerMessage: stkData?.customer_message ?? null,
          responseDescription: data.message ?? null
        }
      });

      if (!tumaResponse.ok || !data.success) {
        await prisma.mpesaPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" }
        });
        throw new AppError(
          data.message || "Payment provider could not start the STK push.",
          502,
          "TUMA_STK_FAILED"
        );
      }

      return {
        success: false,
        status: "PENDING",
        message: stkData?.customer_message || "STK Push sent. Complete payment on your phone to activate this package.",
        plan,
        paymentId: payment.id,
        checkoutRequestId: stkData?.checkout_request_id
      };
    }
  });

  // 3. Poll payment status
  fastify.get("/workspaces/:id/billing/payments/:paymentId", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id, paymentId } = request.params as { id: string; paymentId: string };
      await workspacesService.assertMembership(id, request.authUser!.id);

      const payment = await prisma.mpesaPayment.findFirst({
        where: { id: paymentId, workspaceId: id },
        select: {
          id: true,
          status: true,
          plan: true,
          amount: true,
          resultCode: true,
          resultDescription: true,
          responseDescription: true,
          customerMessage: true,
          mpesaReceiptNumber: true,
          createdAt: true,
          completedAt: true
        }
      });

      if (!payment) {
        throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      }

      return payment;
    }
  });

  // 4. Tuma callback — called by Tuma after STK completion/failure
  fastify.post("/billing/tuma/callback", async (request, reply) => {
    const body = request.body as {
      status?: string;
      merchant_request_id?: string;
      checkout_request_id?: string;
      result_code?: number;
      result_desc?: string;
      timestamp?: string;
      mpesa_receipt_number?: string;
      amount?: number;
      failure_reason?: string;
    };

    if (!body.checkout_request_id) {
      request.log.warn({ body }, "Received Tuma callback without checkout_request_id");
      return reply.send({ success: true });
    }

    const payment = await prisma.mpesaPayment.findUnique({
      where: { checkoutRequestId: body.checkout_request_id },
      include: { workspace: true }
    });

    if (!payment) {
      request.log.warn({ checkout_request_id: body.checkout_request_id }, "Tuma callback for unknown checkout");
      return reply.send({ success: true });
    }

    if (payment.status === "COMPLETED") {
      return reply.send({ success: true });
    }

    const isPaid = body.result_code === 0;

    if (!isPaid) {
      await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          resultCode: body.result_code ?? null,
          resultDescription: body.result_desc ?? body.failure_reason ?? null,
          rawCallback: body as object
        }
      });
      return reply.send({ success: true });
    }

    const now = new Date();
    const currentExpiry = payment.workspace.subscriptionExpiresAt;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const nextExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          resultCode: body.result_code ?? 0,
          resultDescription: body.result_desc ?? "Success",
          mpesaReceiptNumber: body.mpesa_receipt_number ?? null,
          transactionDate: body.timestamp ?? null,
          rawCallback: body as object,
          completedAt: now
        }
      }),
      prisma.workspace.update({
        where: { id: payment.workspaceId },
        data: {
          plan: payment.plan,
          subscriptionExpiresAt: nextExpiry,
          subscriptionCancelAt: null
        }
      })
    ]);

    return reply.send({ success: true });
  });

  // 5. Cancel renewal at end of current billing period
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
        data: { subscriptionCancelAt: workspace.subscriptionExpiresAt ?? new Date() }
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
