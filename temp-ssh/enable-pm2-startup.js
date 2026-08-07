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
  if (result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  await exec("pm2 startup systemd -u root --hp /root");
  await exec("pm2 save");
  await exec("systemctl start pm2-root");
  await exec("systemctl is-enabled pm2-root");
  await exec("systemctl is-active pm2-root");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
