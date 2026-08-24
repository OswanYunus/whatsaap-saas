const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected. Running Certbot SSL configuration...');

  // Configure certbot
  const r = await ssh.execCommand(
    'certbot --nginx -d wa.tukonectdigital.co.ke --non-interactive --agree-tos --email oswanbarackyunus@gmail.com'
  );
  console.log('STDOUT:', r.stdout);
  console.log('STDERR:', r.stderr);

  console.log('=== NETSTAT / SS AFTER SSL ===');
  const r2 = await ssh.execCommand('ss -tlnp | grep -E "(80|443)"');
  console.log(r2.stdout || 'None');

  console.log('=== CAT NGINX SITE CONFIG AFTER SSL ===');
  const r3 = await ssh.execCommand('cat /etc/nginx/sites-available/waas-api');
  console.log(r3.stdout);

  ssh.dispose();
}

run().catch(console.error);
