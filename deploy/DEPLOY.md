# Cerebro — Free VPS Deployment Guide

## What you'll use (all free)

| Service | What for | Free tier |
|---|---|---|
| **Oracle Cloud Free Tier** | VPS (your server) | 1 VM, 1GB RAM, forever free |
| **DuckDNS** | Free subdomain | `yourname.duckdns.org` |
| **Let's Encrypt via Traefik** | Free HTTPS/SSL | Auto-renewed forever |
| **GitHub** | Code storage + deploy trigger | Free |

---

## Step 1 — Get your free VPS (Oracle Cloud)

1. Go to [cloud.oracle.com](https://cloud.oracle.com) → **Sign Up**
2. Choose **Always Free** resources
3. Create a **VM.Standard.E2.1.Micro** instance (Ubuntu 22.04)
4. Download the SSH key (e.g. `ssh-key.key`)
5. Note your **Public IP address**

Open firewall ports in Oracle's Security List:
- Port 80 (HTTP)
- Port 443 (HTTPS)

---

## Step 2 — Get your free domain (DuckDNS — fastest, instant)

1. Go to [duckdns.org](https://duckdns.org) → login with Google
2. Create a subdomain like `mycerebro.duckdns.org`
3. Set the IP to your VPS IP address
4. Done — no approval needed, live in seconds

---

## Step 3 — Set up your VPS

```bash
# SSH in
ssh -i ssh-key.key ubuntu@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
exit

# Log back in
ssh -i ssh-key.key ubuntu@YOUR_VPS_IP

# Install git
sudo apt update && sudo apt install -y git
```

---

## Step 4 — Clone your repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git cerebro
cd cerebro
```

---

## Step 5 — Create your production environment file

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in:
- `DOMAIN` → `mycerebro.duckdns.org` (your DuckDNS subdomain)
- `ACME_EMAIL` → your email (for SSL cert)
- Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it twice — one value for `JWT_ACCESS_SECRET`, another for `JWT_REFRESH_SECRET`.

---

## Step 6 — Run database migrations

```bash
# Start Postgres and Redis first
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis

# Wait for them to be healthy, then run migrations
sleep 15
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
  api sh -c "npx prisma migrate deploy --schema /app/packages/database/prisma/schema.prisma"
```

---

## Step 7 — Build and start everything

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Wait ~2 minutes for SSL. Then visit `https://mycerebro.duckdns.org`.

---

## Step 8 — Verify

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api --tail=50
```

---

## Updating (after git push)

```bash
cd cerebro
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## Client API integration (PHP for cPanel app)

Give your client his API key from **Settings → API Keys**.

His PHP developer calls your live API like this:

```php
<?php
$ch = curl_init('https://mycerebro.duckdns.org/api/v1/send');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer wak_PASTE_KEY_HERE',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'to'      => '254712345678',       // or '0712345678' — auto-normalised
        'message' => 'Hello! Your order #1234 is ready for pickup.',
    ]),
]);
$response = json_decode(curl_exec($ch), true);
// $response = ["ok" => true, "to" => "254712345678", "instanceId" => "..."]
```

No groups, contacts, or campaigns needed — just a number and a message.

---

## Architecture

```
Internet (HTTPS 443)
       │
   Traefik (SSL via Let's Encrypt)
       │
   ┌───┴──────────────────┐
   │                      │
 Web (nginx)          API (Fastify :4000)
 React SPA                │
                    ┌─────┴──────┐
                 Postgres      Redis
                (data)        (BullMQ)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| SSL not working | Check DNS propagation: `nslookup mycerebro.duckdns.org` — must match your VPS IP |
| WhatsApp disconnects after restart | Sessions persist in Docker volume `whatsapp_sessions` — reconnect in Instances page |
| DB connection error | Check all Postgres env vars match exactly in `.env.prod` |
| Traefik SSL error | Check email in `ACME_EMAIL` is valid, wait 5 min for cert |
