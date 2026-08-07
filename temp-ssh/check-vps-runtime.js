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
  await exec("ss -ltnp | grep ':4000' || true");
  await exec("ps aux | grep -E 'node|pm2' | grep -v grep || true");
  await exec("pm2 logs --lines 40 --nostream");
  await exec("curl -fsS http://127.0.0.1/api/auth/register -X OPTIONS -i || true");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
