const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";
const remoteRoot = "/opt/whatsapp-saas";

async function exec(command, cwd = remoteRoot) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function run() {
  console.log("Connecting to VPS...");
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log("Connected.");

  const files = [
    {
      local: "apps/web/src/lib/api.ts",
      remote: `${remoteRoot}/apps/web/src/lib/api.ts`
    },
    {
      local: "apps/web/src/pages/InstanceConnectPage.tsx",
      remote: `${remoteRoot}/apps/web/src/pages/InstanceConnectPage.tsx`
    },
    {
      local: "docker-compose.prod.yml",
      remote: `${remoteRoot}/docker-compose.prod.yml`
    }
  ];

  console.log("\nUploading fixed files...");
  await ssh.putFiles(files);

  console.log("\nRebuilding frontend on VPS...");
  await exec("pnpm --filter @waas/web build");

  console.log("\nChecking built assets for stale production URLs...");
  const grepResult = await ssh.execCommand(
    "grep -R \"localhost:4000\\|cerebro.tukonnect.com\" apps/web/dist || true",
    { cwd: remoteRoot }
  );
  if (grepResult.stdout.trim()) {
    console.log(grepResult.stdout);
    throw new Error("Built frontend still contains a stale API URL.");
  }
  console.log("No stale localhost/domain API URL found in built assets.");

  console.log("\nReloading Nginx...");
  await exec("cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api");
  await exec("nginx -t");
  await exec("systemctl reload nginx");

  console.log("\nChecking services...");
  await exec("pm2 status");
  await exec("curl -fsS http://127.0.0.1/health");
  await exec("curl -fsSI http://127.0.0.1/");

  console.log("\nDone. Try http://178.162.240.231 again.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
