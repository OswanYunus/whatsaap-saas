FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ── deps ──────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --prod=false

# ── builder ───────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .
RUN pnpm --filter @waas/config build 2>/dev/null || true
RUN pnpm --filter @waas/database build 2>/dev/null || true
RUN pnpm --filter @waas/api build

# ── runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./

# Generate Prisma client in the runner image
RUN pnpm --filter @waas/database exec prisma generate

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
