const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';
const domain = 'cerebro.tukonnect.com';

async function executeCommand(command, cwd = '/root') {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return result;
}

async function run() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect({ host, username, password, readyTimeout: 20000 });
    console.log('Connected!');

    // 1. Pull latest code (which has the updated nginx-api.conf)
    console.log('\n--- 1. Pulling latest code ---');
    await executeCommand('git fetch --all && git reset --hard origin/main', '/opt/whatsapp-saas');

    // 2. Rebuild the frontend on the VPS with VITE_API_BASE_URL pointing to HTTPS cerebro.tukonnect.com
    console.log('\n--- 2. Rebuilding Frontend with production URL ---');
    await ssh.execCommand('export VITE_API_BASE_URL=https://cerebro.tukonnect.com && pnpm build', {
      cwd: '/opt/whatsapp-saas',
      onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
      onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); }
    });

    // 3. Update Nginx config with domain name
    console.log('\n--- 3. Configuring Nginx ---');
    await executeCommand(`sed -i 's/api.yourclient.com/${domain}/g' deploy/hostpinacle/nginx-api.conf`, '/opt/whatsapp-saas');
    await executeCommand('cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api', '/opt/whatsapp-saas');
    await executeCommand('ln -sf /etc/nginx/sites-available/waas-api /etc/nginx/sites-enabled/', '/opt/whatsapp-saas');
    await executeCommand('rm -f /etc/nginx/sites-enabled/default');
    await executeCommand('nginx -t && systemctl reload nginx');

    console.log('\n✅ ALL-IN-ONE CONFIGURATION DONE!');
    console.log(`Open HTTP link to verify before SSL: http://${domain}`);
  } catch (err) {
    console.error('Configuration failed:', err);
  } finally {
    ssh.dispose();
  }
}

run();
