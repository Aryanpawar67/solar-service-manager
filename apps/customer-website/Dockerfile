# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

COPY lib/db/package.json                  lib/db/package.json
COPY lib/api-zod/package.json             lib/api-zod/package.json
COPY lib/api-client-react/package.json    lib/api-client-react/package.json
COPY lib/api-spec/package.json            lib/api-spec/package.json
COPY apps/customer-website/package.json   apps/customer-website/package.json

RUN pnpm install --frozen-lockfile

COPY lib/              lib/
COPY apps/customer-website/ apps/customer-website/

RUN pnpm run typecheck:libs
RUN pnpm --filter @workspace/customer-website run build

# ── Stage 2: serve static files with Caddy ───────────────────────────────────
FROM caddy:2-alpine AS runner

COPY --from=builder /app/apps/customer-website/dist/public /srv

COPY apps/customer-website/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
