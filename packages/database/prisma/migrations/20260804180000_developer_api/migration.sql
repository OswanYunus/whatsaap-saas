-- Bring production databases created from the early migrations up to the
-- current application schema, then add the Developer API fields.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AudienceType') THEN
    CREATE TYPE "AudienceType" AS ENUM ('ALL', 'GROUP', 'TAGS', 'MANUAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactStatus') THEN
    CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignStatus')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'CampaignStatus' AND e.enumlabel = 'CANCELLED'
     ) THEN
    ALTER TYPE "CampaignStatus" ADD VALUE 'CANCELLED';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'MessageStatus' AND e.enumlabel = 'SENDING'
    ) THEN
      ALTER TYPE "MessageStatus" ADD VALUE 'SENDING';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'MessageStatus' AND e.enumlabel = 'RETRYING'
    ) THEN
      ALTER TYPE "MessageStatus" ADD VALUE 'RETRYING';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'MessageStatus' AND e.enumlabel = 'CANCELLED'
    ) THEN
      ALTER TYPE "MessageStatus" ADD VALUE 'CANCELLED';
    END IF;
  END IF;
END $$;

ALTER TABLE "Campaign"
  ADD COLUMN IF NOT EXISTS "audienceGroupName" TEXT,
  ADD COLUMN IF NOT EXISTS "audienceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "audienceType" "AudienceType" NOT NULL DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cronExpression" TEXT,
  ADD COLUMN IF NOT EXISTS "footerEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "maxDelaySeconds" INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS "maxPerMinute" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS "minDelaySeconds" INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "publicId" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "templateId" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "Campaign" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);
ALTER TABLE "Campaign" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Contact"
  ADD COLUMN IF NOT EXISTS "fullName" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "Contact" SET "fullName" = COALESCE("fullName", "name", 'Unknown');
UPDATE "Contact" SET "phoneNumber" = COALESCE("phoneNumber", "phone", "id");
UPDATE "Contact" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);
ALTER TABLE "Contact" ALTER COLUMN "fullName" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "phoneNumber" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
  ADD COLUMN IF NOT EXISTS "publicId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "Message" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);
ALTER TABLE "Message" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "WorkspaceApiKey"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "WorkspaceSettings" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "softwareName" TEXT NOT NULL DEFAULT 'Cerebro',
  "footerEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CampaignTemplate" (
  "id" TEXT NOT NULL,
  "publicId" TEXT,
  "workspaceId" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "messageTemplate" TEXT NOT NULL,
  "audienceType" "AudienceType" NOT NULL DEFAULT 'ALL',
  "audienceGroupName" TEXT,
  "audienceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "cronExpression" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "minDelaySeconds" INTEGER NOT NULL DEFAULT 4,
  "maxDelaySeconds" INTEGER NOT NULL DEFAULT 9,
  "maxPerMinute" INTEGER NOT NULL DEFAULT 12,
  "footerEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeveloperApiRequestLog" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "apiKeyId" TEXT,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "ip" TEXT,
  "success" BOOLEAN NOT NULL,
  "responseCode" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeveloperApiRequestLog_pkey" PRIMARY KEY ("id")
);

DROP INDEX IF EXISTS "Contact_workspaceId_phone_key";
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceSettings_workspaceId_key" ON "WorkspaceSettings"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignTemplate_publicId_key" ON "CampaignTemplate"("publicId");
CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_publicId_key" ON "Campaign"("publicId");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_workspaceId_phoneNumber_key" ON "Contact"("workspaceId", "phoneNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Message_publicId_key" ON "Message"("publicId");
CREATE INDEX IF NOT EXISTS "DeveloperApiRequestLog_workspaceId_createdAt_idx" ON "DeveloperApiRequestLog"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "DeveloperApiRequestLog_apiKeyId_createdAt_idx" ON "DeveloperApiRequestLog"("apiKeyId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceSettings_workspaceId_fkey'
  ) THEN
    ALTER TABLE "WorkspaceSettings"
      ADD CONSTRAINT "WorkspaceSettings_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CampaignTemplate_workspaceId_fkey'
  ) THEN
    ALTER TABLE "CampaignTemplate"
      ADD CONSTRAINT "CampaignTemplate_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CampaignTemplate_instanceId_fkey'
  ) THEN
    ALTER TABLE "CampaignTemplate"
      ADD CONSTRAINT "CampaignTemplate_instanceId_fkey"
      FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Campaign_templateId_fkey'
  ) THEN
    ALTER TABLE "Campaign"
      ADD CONSTRAINT "Campaign_templateId_fkey"
      FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeveloperApiRequestLog_workspaceId_fkey'
  ) THEN
    ALTER TABLE "DeveloperApiRequestLog"
      ADD CONSTRAINT "DeveloperApiRequestLog_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeveloperApiRequestLog_apiKeyId_fkey'
  ) THEN
    ALTER TABLE "DeveloperApiRequestLog"
      ADD CONSTRAINT "DeveloperApiRequestLog_apiKeyId_fkey"
      FOREIGN KEY ("apiKeyId") REFERENCES "WorkspaceApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
