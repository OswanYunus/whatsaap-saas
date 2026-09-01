# Cerebro WhatsApp SaaS

Cerebro is a multi-tenant WhatsApp messaging platform for businesses. It supports customer accounts, workspaces, WhatsApp instance connection, contacts, campaigns, scheduled messages, billing packages, admin controls, and a Developer API for external system integrations.

Production URL:

```text
https://wa.tukonectdigital.co.ke
```

## Documentation

- [Full System Documentation](docs/SYSTEM_DOCUMENTATION.md)
- [Developer API Guide](docs/DEVELOPER_API.md)

## Stack

| Layer          | Choice                          |
|----------------|----------------------------------|
| Backend        | Node.js + TypeScript + Fastify   |
| Database       | PostgreSQL + Prisma ORM          |
| Auth           | JWT (`@fastify/jwt`)             |
| Validation     | Zod                              |
| Queue          | BullMQ + Redis                   |
| WhatsApp layer | Baileys |
| Frontend       | React + Vite + TypeScript + Tailwind CSS |
| Monorepo       | pnpm workspaces                  |

## Project structure

```
apps/
  api/            Fastify backend
  web/            React dashboard
packages/
  database/       Prisma schema + shared Prisma client
  config/         Shared env/config loader (Zod-validated)
  types/          Shared TypeScript types (API <-> web)
docker-compose.yml  Postgres + Redis for local dev
```

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker (for Postgres + Redis)

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with strong random
   values, e.g.:

   ```bash
   openssl rand -hex 32
   ```

3. **Start Postgres and Redis**

   ```bash
   pnpm docker:up
   ```

4. **Run database migrations**

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Run the API**

   ```bash
   pnpm dev:api
   ```

   The API listens on `http://localhost:4000`. Check `GET /health`.

6. **Run the queue worker** (separate terminal)

   ```bash
   pnpm dev:worker
   ```

7. **Run the web dashboard** (separate terminal)

   ```bash
   pnpm dev:web
   ```

   The dashboard is served at `http://localhost:5173`.

## Main Features

- Authentication and workspace access.
- WhatsApp instance connection through Baileys.
- Contacts, groups, tags, and imports.
- Campaigns, scheduled campaigns, recurring campaign templates, and message logs.
- BullMQ workers for queued message sending.
- Billing packages with instance and image sending limits.
- Admin dashboard with user management and manual package grants.
- Developer API with workspace API keys, rate limiting, and request logging.

For implementation details, deployment notes, API examples, and integration steps, read the documents in the `docs/` directory.

## Scripts (root `package.json`)

| Script            | Description                          |
|-------------------|---------------------------------------|
| `pnpm dev:api`    | Run the API in watch mode             |
| `pnpm dev:worker` | Run the BullMQ message worker         |
| `pnpm dev:web`    | Run the Vite dev server               |
| `pnpm db:migrate` | Run Prisma migrations (dev)           |
| `pnpm db:studio`  | Open Prisma Studio                    |
| `pnpm docker:up`  | Start Postgres + Redis containers     |
| `pnpm lint`       | Lint all workspace packages           |
