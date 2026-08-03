# Pre-Deploy Checklist (Do This Before the Client Buys the VPS)

Your frontend stays on **Vercel**. The VPS only runs the backend: PostgreSQL, Redis, API, Worker, and Nginx.

---

## 1. Confirm the repo is ready on GitHub

Repo: **https://github.com/OswanYunus/whatsaap-saas.git**

On your Windows PC, make sure everything is pushed:

```powershell
cd D:\Projects\whatsapp-saas
git status
git push origin main
```

The server will `git clone` this repo — nothing should exist only on your laptop.

---

## 2. Generate and save production secrets (keep offline)

Create a local file on your PC (e.g. `D:\Projects\whatsapp-saas-secrets.txt`) — **never commit this**.

Run twice for JWT secrets, once each for DB and Redis:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save four values:

| Variable | Purpose |
|---|---|
| `JWT_ACCESS_SECRET` | User login tokens |
| `JWT_REFRESH_SECRET` | Refresh tokens |
| `POSTGRES_PASSWORD` | Database password |
| `REDIS_PASSWORD` | Queue password |

Pick a database username too, e.g. `waas_user` and database name `waas_db`.

---

## 3. Prepare the production `.env` file (ready to paste on VPS)

Copy `deploy/hostpinacle/.env.vps.example` and fill it in locally:

```env
NODE_ENV=production
API_PORT=4000
API_HOST=0.0.0.0

DATABASE_URL=postgresql://waas_user:YOUR_DB_PASSWORD@localhost:5432/waas_db?schema=public

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

JWT_ACCESS_SECRET=YOUR_ACCESS_SECRET
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d
```

Keep this file ready — you will upload it to the VPS as `/opt/whatsapp-saas/.env` the moment you get the IP.

---

## 4. Decide the API domain with your client

You need a subdomain pointing to the VPS IP, for example:

```
api.clientbusiness.com  →  VPS IP address
```

Ask the client **before** they pay:

- Do they already own a domain? (e.g. `clientbusiness.com`)
- Can they add an **A record** for `api.clientbusiness.com`?

If they have no domain, use a free one temporarily (DuckDNS, etc.) and swap later.

**Vercel will need:** `VITE_API_BASE_URL=https://api.clientbusiness.com`

---

## 5. Tell the client exactly what to buy on HostPinnacle

| Setting | Value |
|---|---|
| OS | Ubuntu 22.04 LTS or 24.04 LTS |
| CPU | 2 cores minimum |
| RAM | 4 GB minimum |
| Storage | 40 GB+ SSD |
| Access | Root password or SSH key |

Also ask them to open ports **22**, **80**, and **443** in the HostPinnacle firewall/security panel.

---

## 6. Prepare Vercel (do now, update later)

In your Vercel project → **Settings → Environment Variables**:

| Name | Value (after deploy) |
|---|---|
| `VITE_API_BASE_URL` | `https://api.clientbusiness.com` |

You can set a placeholder now and redeploy once the VPS is live.

---

## 7. What you will receive from the client

When they purchase, you need:

1. **VPS IP address** (e.g. `203.0.113.50`)
2. **Root password** (or SSH key)
3. **Confirmation** that DNS A record is set (or ability to set it yourself)

---

## 8. Quick reference — deploy day commands

From **PowerShell on your PC**, SSH in:

```powershell
ssh root@VPS_IP
```

On the **VPS**:

```bash
# 1. Clone the repo
git clone https://github.com/OswanYunus/whatsaap-saas.git /opt/whatsapp-saas
cd /opt/whatsapp-saas

# 2. Create production env (paste your prepared values)
nano .env

# 3. Run the setup script
chmod +x deploy/hostpinacle/setup.sh
./deploy/hostpinacle/setup.sh
```

Then Nginx + SSL (replace domain):

```bash
sed -i 's/api.yourclient.com/api.clientbusiness.com/g' deploy/hostpinacle/nginx-api.conf
cp deploy/hostpinacle/nginx-api.conf /etc/nginx/sites-available/waas-api
ln -sf /etc/nginx/sites-available/waas-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d api.clientbusiness.com
```

Verify:

```bash
curl https://api.clientbusiness.com/health
pm2 status
pm2 logs waas-api --lines 30
```

Update Vercel `VITE_API_BASE_URL` and redeploy the frontend.

---

## Architecture (your setup)

```
Vercel (React dashboard)
        │
        │  HTTPS  VITE_API_BASE_URL
        ▼
HostPinnacle VPS
  ├── Nginx :443  →  API :4000
  ├── PM2: waas-api      (WhatsApp + HTTP)
  ├── PM2: waas-worker   (message queue)
  ├── PostgreSQL
  └── Redis
```

---

## Important notes

- Antigravity mentioned `db:push` — this project uses **migrations**. The setup script runs `pnpm --filter @waas/database migrate:deploy` instead.
- **Both API and worker must run.** Campaigns and queued messages will not work without the worker.
- API listens on port **4000** (not 3000).
- Health check: `GET /health` (no `/api` prefix).
