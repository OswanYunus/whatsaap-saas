const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function exec(cmd, cwd = '/opt/whatsapp-saas') {
  console.log(`\n> ${cmd}`);
  const r = await ssh.execCommand(cmd, { cwd });
  if (r.stdout) console.log(r.stdout);
  if (r.stderr) console.error(r.stderr);
  return r;
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log('Connected!\n');

  // Force reset and pull
  await exec('git fetch --all && git reset --hard origin/main');

  // Check what's in the dist folder for the api package
  await exec('ls packages/config/dist/ 2>/dev/null || echo "NO DIST FOLDER"');
  await exec('ls packages/database/dist/ 2>/dev/null || echo "NO DIST FOLDER"');

  // Try running the server directly and capture all output
  console.log('\n--- Running API directly ---');
  const r = await ssh.execCommand(
    'export $(grep -v "^#" /opt/whatsapp-saas/.env | xargs) && node /opt/whatsapp-saas/apps/api/dist/server.js',
    { cwd: '/opt/whatsapp-saas' }
  );
  console.log('STDOUT:', r.stdout);
  console.log('STDERR:', r.stderr);

  ssh.dispose();
}

run().catch(console.error);
