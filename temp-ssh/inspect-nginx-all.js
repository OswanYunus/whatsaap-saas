const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== LIST SITES ENABLED ===');
  const r1 = await ssh.execCommand('ls -l /etc/nginx/sites-enabled');
  console.log(r1.stdout);

  console.log('=== CAT DEFAULT IF EXISTS ===');
  const r2 = await ssh.execCommand('cat /etc/nginx/sites-enabled/default');
  console.log(r2.stdout);

  console.log('=== CAT WAAS-API IN ENABLED ===');
  const r3 = await ssh.execCommand('cat /etc/nginx/sites-enabled/waas-api');
  console.log(r3.stdout);

  ssh.dispose();
}

run().catch(console.error);
