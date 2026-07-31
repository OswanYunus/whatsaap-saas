FROM node:20-alpine AS builder
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm --filter @waas/web build

# ── Serve with nginx ──────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
