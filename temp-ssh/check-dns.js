const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== PING CEREBRO ===');
  const r1 = await ssh.execCommand('ping -c 1 -W 2 cerebro.tukonectdigital.co.ke');
  console.log(r1.stdout || r1.stderr);

  console.log('=== PING WA ===');
  const r2 = await ssh.execCommand('ping -c 1 -W 2 wa.tukonectdigital.co.ke');
  console.log(r2.stdout || r2.stderr);

  ssh.dispose();
}

run().catch(console.error);
