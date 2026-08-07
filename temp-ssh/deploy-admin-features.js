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
  await ssh.connect({ host, username, password, readyTimeout: 30000 });
  console.log('Connected to HostPinnacle VPS!\n');

  // Hard reset local changes on server and pull latest from GitHub
  console.log('--- Pulling latest code ---');
  await exec('git fetch --all');
  await exec('git reset --hard origin/main');
  await exec('git pull origin main');

  // Apply new database schema fields
  console.log('\n--- Sychronizing database schema ---');
  await exec('npx prisma db push --accept-data-loss', '/opt/whatsapp-saas/packages/database');
  await exec('npx prisma generate', '/opt/whatsapp-saas/packages/database');

  // Build the code
  console.log('\n--- Building application ---');
  await ssh.execCommand('pnpm build', {
    cwd: '/opt/whatsapp-saas',
    onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
    onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); }
  });

  // Update Nginx
  console.log('\n--- Updating Nginx configuration ---');
  await exec('cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api');
  await exec('ln -sf /etc/nginx/sites-available/waas-api /etc/nginx/sites-enabled/');
  await exec('nginx -t && systemctl reload nginx');

  // Restart PM2
  console.log('\n--- Restarting PM2 processes ---');
  await exec('pm2 delete all 2>/dev/null || true');
  await exec('pm2 start deploy/hostpinacle/ecosystem.config.cjs');
  await exec('pm2 save');

  // Verify status
  console.log('\n--- Verifying status ---');
  await new Promise(r => setTimeout(r, 6000));
  await exec('pm2 status');
  await exec('curl -s http://localhost:4000/health || curl -s http://localhost:4000/api/health');

  console.log('\n✅ Deployment finished successfully!');
  ssh.dispose();
}

run().catch((err) => {
  console.error(err);
  ssh.dispose();
});
