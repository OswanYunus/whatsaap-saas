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
  BASIC: 500,
  PREMIUM: 1000,
  PRO: 1500
} as const;

function normalizePhone(value: string) {
  let clean = value.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = `254${clean.slice(1)}`;
  if (clean.startsWith("7") && clean.length === 9) clean = `254${clean}`;
  return clean;
}

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function mpesaConfig() {
  const missing = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL"
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new AppError(
      "M-Pesa checkout is not configured yet. Package activation requires confirmed STK payment.",
      503,
      "MPESA_NOT_CONFIGURED",
      { missing }
    );
  }

  const stkPushUrl = process.env.MPESA_STK_PUSH_URL || "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
  const oauthUrl = process.env.MPESA_OAUTH_URL || (
    stkPushUrl.includes("sandbox")
      ? "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
  );

  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    passkey: process.env.MPESA_PASSKEY!,
    callbackUrl: process.env.MPESA_CALLBACK_URL!,
    transactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
    accountReference: process.env.MPESA_ACCOUNT_REFERENCE || "CEREBRO",
    transactionDesc: process.env.MPESA_TRANSACTION_DESC || "Cerebro subscription",
    stkPushUrl,
    oauthUrl,
    amountOverride: process.env.MPESA_AMOUNT_OVERRIDE ? Number(process.env.MPESA_AMOUNT_OVERRIDE) : null
  };
}

async function getMpesaAccessToken(config: ReturnType<typeof mpesaConfig>) {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const response = await fetch(config.oauthUrl, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const data = await response.json() as { access_token?: string; errorMessage?: string; error?: string };

  if (!response.ok || !data.access_token) {
    throw new AppError(
      data.errorMessage || data.error || "Failed to authenticate with M-Pesa.",
      502,
      "MPESA_AUTH_FAILED"
    );
  }

  return data.access_token;
}

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

  // 2. Start STK Push checkout. Package activation happens only from callback success.
  fastify.post("/workspaces/:id/billing/checkout", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id } = request.params as { id: string };
      const { plan, phoneNumber } = checkoutSchema.parse(request.body);
      await workspacesService.assertMembership(id, request.authUser!.id);

      const config = mpesaConfig();
      const phone = normalizePhone(phoneNumber);
      if (!/^2547\d{8}$/.test(phone)) {
        throw new AppError("Enter a valid Safaricom phone number.", 400, "INVALID_PHONE_NUMBER");
      }

      const amount = config.amountOverride && config.amountOverride > 0 ? config.amountOverride : PLAN_PRICES[plan];
      const requestTimestamp = timestamp();
      const password = Buffer.from(`${config.shortcode}${config.passkey}${requestTimestamp}`).toString("base64");
      const payload = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: requestTimestamp,
        TransactionType: config.transactionType,
        Amount: amount,
        PartyA: phone,
        PartyB: config.shortcode,
        PhoneNumber: phone,
        CallBackURL: config.callbackUrl,
        AccountReference: config.accountReference,
        TransactionDesc: config.transactionDesc
      };

      const payment = await prisma.mpesaPayment.create({
        data: {
          workspaceId: id,
          userId: request.authUser!.id,
          plan,
          amount,
          phoneNumber: phone,
          rawRequest: { ...payload, Password: "[generated]" }
        }
      });

      const accessToken = await getMpesaAccessToken(config);
      const mpesaResponse = await fetch(config.stkPushUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await mpesaResponse.json() as {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        ResponseCode?: string;
        ResponseDescription?: string;
        CustomerMessage?: string;
        errorMessage?: string;
        errorCode?: string;
      };

      await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          merchantRequestId: data.MerchantRequestID,
          checkoutRequestId: data.CheckoutRequestID,
          responseCode: data.ResponseCode,
          responseDescription: data.ResponseDescription || data.errorMessage,
          customerMessage: data.CustomerMessage
        }
      });

      if (!mpesaResponse.ok || data.ResponseCode !== "0") {
        await prisma.mpesaPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" }
        });
        throw new AppError(
          data.errorMessage || data.ResponseDescription || "M-Pesa could not start the STK Push.",
          502,
          data.errorCode || "MPESA_STK_FAILED"
        );
      }

      return {
        success: false,
        status: "PENDING",
        message: data.CustomerMessage || "STK Push sent. Your package will activate after M-Pesa confirms payment.",
        plan,
        paymentId: payment.id,
        checkoutRequestId: data.CheckoutRequestID
      };
    }
  });

  fastify.get("/workspaces/:id/billing/payments/:paymentId", {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const { id, paymentId } = request.params as { id: string; paymentId: string };
      await workspacesService.assertMembership(id, request.authUser!.id);

      const payment = await prisma.mpesaPayment.findFirst({
        where: {
          id: paymentId,
          workspaceId: id
        },
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

  fastify.post("/billing/mpesa/callback", async (request, reply) => {
    const body = request.body as {
      Body?: {
        stkCallback?: {
          MerchantRequestID?: string;
          CheckoutRequestID?: string;
          ResultCode?: number;
          ResultDesc?: string;
          CallbackMetadata?: {
            Item?: Array<{ Name: string; Value?: string | number }>;
          };
        };
      };
    };
    const callback = body.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) {
      request.log.warn({ body }, "Received invalid M-Pesa callback");
      return reply.send({ success: true });
    }

    const payment = await prisma.mpesaPayment.findUnique({
      where: { checkoutRequestId: callback.CheckoutRequestID },
      include: { workspace: true }
    });
    if (!payment) {
      request.log.warn({ checkoutRequestId: callback.CheckoutRequestID }, "Received M-Pesa callback for unknown checkout request");
      return reply.send({ success: true });
    }
    if (payment.status === "COMPLETED") {
      return reply.send({ success: true });
    }

    const metadata = Object.fromEntries(
      (callback.CallbackMetadata?.Item ?? []).map((item) => [item.Name, item.Value])
    );
    const isPaid = callback.ResultCode === 0;

    if (!isPaid) {
      await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          resultCode: callback.ResultCode,
          resultDescription: callback.ResultDesc,
          rawCallback: body
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
          resultCode: callback.ResultCode,
          resultDescription: callback.ResultDesc,
          mpesaReceiptNumber: metadata.MpesaReceiptNumber ? String(metadata.MpesaReceiptNumber) : null,
          transactionDate: metadata.TransactionDate ? String(metadata.TransactionDate) : null,
          rawCallback: body,
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
