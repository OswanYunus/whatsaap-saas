const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

async function exec(command) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: "/opt/whatsapp-saas" });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return result;
}

async function run() {
  await ssh.connect({
    host: "178.162.240.231",
    username: "root",
    password: "hGrA6wXBgdgE3kFD",
    readyTimeout: 20000
  });

  await exec(`bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; pnpm --filter @waas/database exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel /opt/whatsapp-saas/packages/database/prisma/schema.prisma --script'`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
