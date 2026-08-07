const { NodeSSH } = require("node-ssh");
const path = require("node:path");

const ssh = new NodeSSH();
const remoteRoot = "/opt/whatsapp-saas";

async function exec(command, required = true) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: remoteRoot });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (required && result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function run() {
  await ssh.connect({
    host: "178.162.240.231",
    username: "root",
    password: "hGrA6wXBgdgE3kFD",
    readyTimeout: 20000
  });

  await ssh.putFile(
    path.resolve("apps/api/src/modules/whatsapp/whatsapp.manager.ts"),
    `${remoteRoot}/apps/api/src/modules/whatsapp/whatsapp.manager.ts`
  );

  await exec("pnpm --filter @waas/api build");
  await exec("pm2 restart waas-api --update-env");
  await exec("pm2 save");
  await exec("curl -fsS http://127.0.0.1:4000/health");
  await exec("curl -fsS https://cerebro.tukonectdigital.co.ke/health");
  await exec("pm2 status");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
