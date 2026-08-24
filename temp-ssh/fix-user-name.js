const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

async function exec(command, cwd) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: cwd || "/opt/whatsapp-saas" });
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

  console.log("Connected. Updating user name...");

  const cmd = `printf 'UPDATE "User" SET "name" = \\x27Oswan Yunus\\x27 WHERE "email" = \\x27oswanbarackyunus@gmail.com\\x27;\\n' | bash -lc 'export $(grep -v "^#" /opt/whatsapp-saas/.env | xargs) && cd /opt/whatsapp-saas/packages/database && npx prisma db execute --stdin'`;

  await exec(cmd, "/opt/whatsapp-saas/packages/database");

  console.log("\nDone.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
