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

  await exec(`bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; DB="$\{DATABASE_URL%%\\?*}"; psql "$DB" -Atc "select tablename from pg_tables where schemaname='"'"'public'"'"' order by tablename;"'`);
  await exec(`bash -lc 'set -a; source /opt/whatsapp-saas/.env; set +a; DB="$\{DATABASE_URL%%\\?*}"; psql "$DB" -Atc "select migration_name, finished_at, rolled_back_at from \\"_prisma_migrations\\" order by started_at;"'`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
