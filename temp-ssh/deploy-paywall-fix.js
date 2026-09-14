const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";
const remoteRoot = "/opt/whatsapp-saas";

async function exec(command) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: remoteRoot });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function execWithEnv(command) {
  return exec(`set -a && . ${remoteRoot}/.env && set +a && ${command}`);
}

async function run() {
  console.log("Connecting to VPS...");
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("Connected.");

  console.log("\nUploading source changes...");
  await ssh.putDirectory("apps/api/src", `${remoteRoot}/apps/api/src`, {
    recursive: true,
    concurrency: 8
  });
  await ssh.putDirectory("apps/web/src", `${remoteRoot}/apps/web/src`, {
    recursive: true,
    concurrency: 8
  });
  await ssh.putDirectory("packages/database/prisma", `${remoteRoot}/packages/database/prisma`, {
    recursive: true,
    concurrency: 8
  });

  console.log("\nApplying database migrations...");
  await execWithEnv("pnpm --filter @waas/database migrate:deploy");

  console.log("\nRegenerating Prisma client and rebuilding...");
  await execWithEnv("pnpm --filter @waas/database generate");
  await execWithEnv("pnpm build");

  console.log("\nRestarting application...");
  await exec("pm2 restart all");
  await exec("pm2 save");

  console.log("\nVerifying HTTPS app and billing API...");
  await exec("pm2 status");
  await exec("curl -fsSI https://wa.tukonectdigital.co.ke/");
  await exec("curl -fsS https://wa.tukonectdigital.co.ke/health");

  console.log("\nPaywall fix deployed.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
