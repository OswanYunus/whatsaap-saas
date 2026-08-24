const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== NGINX SYSTEMD STATUS ===');
  const r1 = await ssh.execCommand('systemctl status nginx');
  console.log(r1.stdout || r1.stderr);

  console.log('=== NGINX ERROR LOGS ===');
  const r2 = await ssh.execCommand('tail -n 30 /var/log/nginx/error.log');
  console.log(r2.stdout || r2.stderr);

  ssh.dispose();
}

run().catch(console.error);
