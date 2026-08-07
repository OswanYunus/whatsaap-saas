const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected to HostPinnacle VPS!');

  // Export env vars from .env and run prisma db push
  console.log('Running database synchronization...');
  const result = await ssh.execCommand(
    'export $(grep -v "^#" /opt/whatsapp-saas/.env | xargs) && npx prisma db push --accept-data-loss',
    { cwd: '/opt/whatsapp-saas/packages/database' }
  );

  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);

  // Restart API to pick up database client updates (even though it's already running, it needs to see the schema updates)
  console.log('Restarting PM2 processes...');
  await ssh.execCommand('pm2 restart all', { cwd: '/opt/whatsapp-saas' });

  console.log('Finished!');
  ssh.dispose();
}

run().catch((err) => {
  console.error(err);
  ssh.dispose();
});
