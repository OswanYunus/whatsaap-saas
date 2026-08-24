const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected.');

  console.log('=== UFW STATUS ===');
  const r1 = await ssh.execCommand('ufw status');
  console.log(r1.stdout || r1.stderr || 'ufw not installed or inactive');

  console.log('=== IPTABLES RULES ===');
  const r2 = await ssh.execCommand('iptables -L -n -v | grep -i "443"');
  console.log(r2.stdout || 'No explicit 443 rules');

  console.log('=== APF FIREWALL STATUS ===');
  const r3 = await ssh.execCommand('apf --status || systemctl status apf');
  console.log(r3.stdout || r3.stderr || 'No apf firewall');

  ssh.dispose();
}

run().catch(console.error);
