ALTER TABLE "Workspace"
  ADD COLUMN IF NOT EXISTS "subscriptionCancelAt" TIMESTAMP(3);
