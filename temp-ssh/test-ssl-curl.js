const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== LOCAL SSL CURL ===');
  const r1 = await ssh.execCommand('curl -Iv https://wa.tukonectdigital.co.ke --resolve wa.tukonectdigital.co.ke:443:127.0.0.1');
  console.log('STDOUT:', r1.stdout);
  console.log('STDERR:', r1.stderr);

  ssh.dispose();
}

run().catch(console.error);
