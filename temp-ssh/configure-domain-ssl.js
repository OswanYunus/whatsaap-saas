const { NodeSSH } = require("node-ssh");

const ssh = new NodeSSH();

const host = "178.162.240.231";
const username = "root";
const password = "hGrA6wXBgdgE3kFD";
const remoteRoot = "/opt/whatsapp-saas";
const domain = "cerebro.tukonectdigital.co.ke";
const email = "admin@tukonectdigital.co.ke";

async function exec(command) {
  console.log(`\n> ${command}`);
  const result = await ssh.execCommand(command, { cwd: remoteRoot });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.code !== 0) {
    throw new Error(`Command failed with exit code ${result.code}: ${command}`);
  }
  return result;
}

async function run() {
  await ssh.connect({ host, username, password, readyTimeout: 20000 });

  const nginxConfig = `
server {
    listen 80 default_server;
    server_name ${domain} _;

    root /opt/whatsapp-saas/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(api|health) {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
`;

  await exec(`cat > /etc/nginx/sites-available/waas-api <<'EOF'\n${nginxConfig}\nEOF`);
  await exec("ln -sf /etc/nginx/sites-available/waas-api /etc/nginx/sites-enabled/waas-api");
  await exec("nginx -t");
  await exec("systemctl reload nginx");
  await exec(`curl -fsSI -H 'Host: ${domain}' http://127.0.0.1/`);
  await exec(`certbot --nginx -d ${domain} --non-interactive --agree-tos -m ${email} --redirect`);
  await exec("nginx -t");
  await exec("systemctl reload nginx");
  await exec(`curl -fsSI https://${domain}/`);
  await exec(`curl -fsS https://${domain}/health`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
