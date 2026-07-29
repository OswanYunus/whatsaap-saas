# WhatsApp Automation SaaS — Project Foundation

A multi-tenant platform for connecting WhatsApp accounts, managing contacts,
running campaigns, and tracking delivery logs. This repository currently
contains the **project foundation only**: server bootstrap, auth scaffold,
database schema, queue wiring, and an empty dashboard shell. Feature logic
(campaign sending, WhatsApp pairing, delivery tracking) is intentionally not
yet implemented — see the "What's stubbed" section below.

## Stack

| Layer          | Choice                          |
|----------------|----------------------------------|
| Backend        | Node.js + TypeScript + Fastify   |
| Database       | PostgreSQL + Prisma ORM          |
| Auth           | JWT (`@fastify/jwt`)             |
| Validation     | Zod                              |
| Queue          | BullMQ + Redis                   |
| WhatsApp layer | Baileys (contract only, not wired up yet) |
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

## What's implemented vs. stubbed

**Implemented:**
- Fastify server with CORS, JWT, structured logging (pino), and a
  centralized error-handling plugin (`AppError` + Zod error formatting).
- Prisma schema for all seven core entities (User, Workspace,
  WhatsAppInstance, Contact, Campaign, Message, ApiKey).
- Auth module: register/login/me, password hashing (bcrypt), JWT issuing.
- Users module: profile lookup.
- BullMQ queue + worker skeleton for message sending.
- Dashboard shell: routing, sidebar, layout, six empty pages.

**Stubbed / intentionally not built yet:**
- `WhatsAppService.sendMessage` — throws "not implemented"; defines the
  contract the rest of the app will call once Baileys is wired up.
- Baileys session creation, QR pairing, and connection-event handling.
- Campaign creation/scheduling logic and contact import.
- Delivery log UI and real dashboard data (pages are placeholders).
- Refresh-token rotation and workspace switching UI.
- Rate limiting per WhatsApp instance.

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