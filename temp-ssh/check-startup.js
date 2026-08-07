const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";

async function exec(command) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: "/opt/whatsapp-saas" });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return result;
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  await exec("systemctl is-enabled pm2-root || true");
  await exec("systemctl is-active pm2-root || true");
  await exec("pm2 status");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
