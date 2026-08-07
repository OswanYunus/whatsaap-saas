const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = '178.162.240.231';
const username = 'root';
const password = 'hGrA6wXBgdgE3kFD';

async function exec(cmd, cwd = '/opt/whatsapp-saas') {
  console.log(`\n> ${cmd}`);
  const r = await ssh.execCommand(cmd, { cwd });
  if (r.stdout) console.log(r.stdout);
  if (r.stderr) console.error(r.stderr);
  return r;
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });
  console.log('Connected!\n');

  // Pull the fixed package.json files
  await exec('git pull origin main');

  // Rebuild everything (packages now have correct main entries)
  console.log('\n--- Rebuilding ---');
  await ssh.execCommand('pnpm build', {
    cwd: '/opt/whatsapp-saas',
    onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
    onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); }
  });

  // Update nginx with catch-all config
  console.log('\n--- Updating Nginx ---');
  await exec('cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api');
  await exec('nginx -t && systemctl reload nginx');

  // Restart PM2 with updated env
  console.log('\n--- Restarting PM2 ---');
  await exec('pm2 delete all 2>/dev/null || true');
  await exec('pm2 start deploy/hostpinacle/ecosystem.config.cjs');
  await exec('pm2 save');

  // Wait 5s for startup then check logs
  await new Promise(r => setTimeout(r, 5000));
  await exec('pm2 status');
  await exec('pm2 logs waas-api --lines 20 --nostream');

  console.log('\n✅ Done! Try: http://178.162.240.231');
  ssh.dispose();
}

run().catch(console.error);
