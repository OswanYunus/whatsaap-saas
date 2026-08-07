const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected to HostPinnacle VPS!');

  console.log('Setting isVerified = true for all existing users...');
  const result = await ssh.execCommand(
    'export $(grep -v "^#" /opt/whatsapp-saas/.env | xargs) && npx prisma db execute --stdin',
    { 
      cwd: '/opt/whatsapp-saas/packages/database',
      stdin: 'UPDATE "User" SET "isVerified" = true;'
    }
  );

  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);

  console.log('Finished verifying existing users!');
  ssh.dispose();
}

run().catch((err) => {
  console.error(err);
  ssh.dispose();
});
