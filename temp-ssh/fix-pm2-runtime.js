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

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });

  const portResult = await ssh.execCommand("ss -ltnp | grep ':4000' || true", { cwd: remoteRoot });
  const pidMatch = portResult.stdout.match(/pid=(\d+)/);
  if (pidMatch) {
    await exec(`kill ${pidMatch[1]}`);
  } else {
    console.log("No unmanaged process found on port 4000.");
  }
  await exec("pm2 delete all || true");
  await exec("pm2 start deploy/hostpinacle/ecosystem.config.cjs");
  await exec("pm2 save");
  await exec("pm2 status");
  await exec("ss -ltnp | grep ':4000'");
  await exec("curl -fsS http://127.0.0.1/health");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
