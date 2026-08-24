const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== NETSTAT / SS LISTENING PORTS ===');
  const r1 = await ssh.execCommand('ss -tlnp | grep -E "(80|443)"');
  console.log(r1.stdout || 'None');

  console.log('=== RUNNING WEB SERVERS ===');
  const r2 = await ssh.execCommand('ps aux | grep -E "(nginx|apache|httpd)" | grep -v grep');
  console.log(r2.stdout || 'None');

  console.log('=== CERTBOT CRON OR CERT LOCATION ===');
  const r3 = await ssh.execCommand('ls -l /etc/letsencrypt/live');
  console.log(r3.stdout || 'None');

  ssh.dispose();
}

run().catch(console.error);
