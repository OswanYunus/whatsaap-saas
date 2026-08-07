const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected to HostPinnacle VPS!');

  // Set the phone number for their main testing email
  console.log('Setting phone number for oswanbarackyunus@gmail.com...');
  const result = await ssh.execCommand(
    'export $(grep -v "^#" /opt/whatsapp-saas/.env | xargs) && npx prisma db execute --stdin',
    { 
      cwd: '/opt/whatsapp-saas/packages/database',
      stdin: 'UPDATE "User" SET "phoneNumber" = \'254791584056\' WHERE "email" = \'oswanbarackyunus@gmail.com\';'
    }
  );

  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);

  ssh.dispose();
}

run().catch((err) => {
  console.error(err);
  ssh.dispose();
});
