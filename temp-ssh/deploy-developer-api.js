const { NodeSSH } = require("node-ssh");
const path = require("node:path");

const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";
const remoteRoot = "/opt/whatsapp-saas";

const files = [
  "apps/api/src/app.ts",
  "apps/api/src/modules/api-keys/api-keys.controller.ts",
  "apps/api/src/modules/api-keys/api-keys.routes.ts",
  "apps/api/src/modules/api-keys/api-keys.schema.ts",
  "apps/api/src/modules/api-keys/api-keys.service.ts",
  "apps/api/src/modules/campaigns/campaign-template.service.ts",
  "apps/api/src/modules/campaigns/campaigns.service.ts",
  "apps/api/src/modules/developer-api/developer-api.routes.ts",
  "apps/api/src/modules/developer-api/developer-api.schema.ts",
  "apps/api/src/modules/developer-api/developer-api.service.ts",
  "apps/api/src/modules/public/public-send.routes.ts",
  "apps/api/src/plugins/api-key-auth.ts",
  "apps/api/src/queue/queues/message.queue.ts",
  "apps/api/src/queue/workers/message.worker.ts",
  "apps/web/src/components/Sidebar.tsx",
  "apps/web/src/pages/DeveloperApiPage.tsx",
  "apps/web/src/pages/SettingsPage.tsx",
  "apps/web/src/router.tsx",
  "packages/database/prisma/schema.prisma",
  "packages/database/prisma/migrations/20260804180000_developer_api/migration.sql",
  "packages/database/prisma/migrations/20260804195000_drop_updated_at_defaults/migration.sql"
];

async function exec(command, options = {}) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: remoteRoot, ...options });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function uploadFiles() {
  const uploads = files.map((file) => ({
    local: path.resolve(file),
    remote: `${remoteRoot}/${file.replaceAll("\\", "/")}`
  }));

  await exec("mkdir -p apps/api/src/modules/developer-api packages/database/prisma/migrations/20260804180000_developer_api packages/database/prisma/migrations/20260804195000_drop_updated_at_defaults");
  console.log("\nUploading Developer API files...");
  await ssh.putFiles(uploads);
}

async function run() {
  console.log("Connecting to VPS...");
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("Connected.");

  await exec("test -d /opt/whatsapp-saas && test -f /opt/whatsapp-saas/.env");
  await exec("pm2 status");
  await uploadFiles();

  console.log("\nCreating database backup if pg_dump is available...");
  await exec(
    "bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; mkdir -p /opt/whatsapp-saas/backups; if command -v pg_dump >/dev/null 2>&1; then BACKUP_DATABASE_URL=\"${DATABASE_URL%%\\?*}\"; pg_dump \"$BACKUP_DATABASE_URL\" > /opt/whatsapp-saas/backups/pre-developer-api-$(date +%Y%m%d%H%M%S).sql; else echo pg_dump_not_available_skipping_backup; fi'"
  );

  console.log("\nInstalling missing packages if needed...");
  await exec("pnpm install --frozen-lockfile");

  console.log("\nGenerating Prisma client...");
  await exec("bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; pnpm --filter @waas/database generate'");

  console.log("\nApplying database migrations...");
  await exec("bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; pnpm --filter @waas/database migrate:deploy'");

  console.log("\nBuilding updated app...");
  await exec("pnpm build", {
    onStdout(chunk) { process.stdout.write(chunk.toString("utf8")); },
    onStderr(chunk) { process.stderr.write(chunk.toString("utf8")); }
  });

  console.log("\nRestarting PM2 services...");
  await exec("pm2 restart waas-api --update-env");
  await exec("pm2 restart waas-worker --update-env");
  await exec("pm2 save");

  console.log("\nVerifying local and public endpoints...");
  await exec("curl -fsS http://127.0.0.1:4000/health");
  await exec("curl -fsS http://127.0.0.1:4000/api/v1/health");
  await exec("curl -fsS https://cerebro.tukonectdigital.co.ke/health");
  await exec("curl -fsS https://cerebro.tukonectdigital.co.ke/api/v1/health");
  await exec("curl -fsSI https://cerebro.tukonectdigital.co.ke/");
  await exec("pm2 status");

  console.log("\nDeveloper API deployment completed.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
