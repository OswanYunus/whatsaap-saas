const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== CURRENT ACTIVE PORTS ===');
  const r1 = await ssh.execCommand('ss -tlnp');
  console.log(r1.stdout);

  ssh.dispose();
}

run().catch(console.error);
