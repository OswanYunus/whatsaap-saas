#!/usr/bin/env bash
# HostPinnacle VPS setup — Ubuntu 22.04/24.04, backend only (frontend on Vercel).
# Run as root on a fresh VPS after copying .env to /opt/whatsapp-saas/.env
set -euo pipefail

APP_DIR="/opt/whatsapp-saas"
REPO_URL="https://github.com/OswanYunus/whatsaap-saas.git"
NODE_MAJOR=20

echo "==> Updating system packages..."
apt-get update -y
apt-get upgrade -y

echo "==> Installing base tools..."
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

echo "==> Installing Node.js ${NODE_MAJOR}..."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y nodejs
npm install -g pnpm@9.7.0 pm2

echo "==> Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

echo "==> Installing Redis..."
apt-get install -y redis-server

echo "==> Cloning/updating application..."
if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "ERROR: Create ${APP_DIR}/.env before running this script."
  echo "Copy deploy/hostpinacle/.env.vps.example to ${APP_DIR}/.env and fill in secrets."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "${APP_DIR}/.env"
set +a

cd "${APP_DIR}"
git pull

DB_USER="${DATABASE_URL#postgresql://}"
DB_USER="${DB_USER%%:*}"
DB_PASS="${DATABASE_URL#postgresql://${DB_USER}:}"
DB_PASS="${DB_PASS%%@*}"
DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"

echo "==> Configuring PostgreSQL user/database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "==> Configuring Redis password..."
sed -i "s/^# requirepass .*/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf
grep -q "^requirepass " /etc/redis/redis.conf || echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf
systemctl restart redis-server

pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @waas/database migrate:deploy
pnpm build

echo "==> Starting PM2 processes..."
pm2 delete waas-api waas-worker 2>/dev/null || true
pm2 start deploy/hostpinacle/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> Configuring firewall..."
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo ""
echo "Setup complete."
echo "Next steps:"
echo "  1. Edit deploy/hostpinacle/nginx-api.conf with your domain, then:"
echo "     sudo cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api"
echo "     sudo ln -sf /etc/nginx/sites-available/waas-api /etc/nginx/sites-enabled/"
echo "     sudo rm -f /etc/nginx/sites-enabled/default"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo "  2. Point api.yourclient.com DNS A record to this server's IP"
echo "  3. sudo certbot --nginx -d api.yourclient.com"
echo "  4. Update Vercel VITE_API_BASE_URL=https://api.yourclient.com and redeploy"
