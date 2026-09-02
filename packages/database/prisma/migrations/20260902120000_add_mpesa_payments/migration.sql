CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "MpesaPayment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "plan" "Plan" NOT NULL,
  "amount" INTEGER NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "merchantRequestId" TEXT,
  "checkoutRequestId" TEXT,
  "responseCode" TEXT,
  "responseDescription" TEXT,
  "customerMessage" TEXT,
  "resultCode" INTEGER,
  "resultDescription" TEXT,
  "mpesaReceiptNumber" TEXT,
  "transactionDate" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "rawRequest" JSONB,
  "rawCallback" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "MpesaPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MpesaPayment_checkoutRequestId_key" ON "MpesaPayment"("checkoutRequestId");
CREATE INDEX "MpesaPayment_workspaceId_createdAt_idx" ON "MpesaPayment"("workspaceId", "createdAt");
CREATE INDEX "MpesaPayment_status_createdAt_idx" ON "MpesaPayment"("status", "createdAt");

ALTER TABLE "MpesaPayment" ADD CONSTRAINT "MpesaPayment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
