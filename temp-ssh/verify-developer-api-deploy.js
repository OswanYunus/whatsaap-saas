const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

async function exec(command, required = true) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: "/opt/whatsapp-saas" });
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

  await exec("pm2 status");
  await exec("curl -fsS http://127.0.0.1:4000/health");
  await exec("curl -fsS http://127.0.0.1:4000/api/v1/health");
  await exec("curl -fsS https://cerebro.tukonectdigital.co.ke/api/v1/health");
  await exec("curl -fsSI https://cerebro.tukonectdigital.co.ke/");
  await exec(`bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; DB="$\{DATABASE_URL%%\\?*}"; psql "$DB" -Atc "select migration_name, finished_at is not null as finished, rolled_back_at is not null as rolled_back from \\"_prisma_migrations\\" order by started_at;"'`);
  await exec("pm2 logs waas-api --lines 20 --nostream", false);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
