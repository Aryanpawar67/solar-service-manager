# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm

WORKDIR /app

# Copy manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

# Lib manifests
COPY lib/db/package.json             lib/db/package.json
COPY lib/api-zod/package.json        lib/api-zod/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json       lib/api-spec/package.json

# API server manifest
COPY apps/api-server/package.json apps/api-server/package.json

RUN pnpm install --frozen-lockfile

# Copy all source
COPY lib/      lib/
COPY apps/api-server/ apps/api-server/

# Build libs then API server
RUN pnpm run typecheck:libs
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy what's needed at runtime
COPY --from=builder /app/apps/api-server/dist ./dist
# node_modules are needed for externalized packages (twilio, pdfkit, multer, bcrypt)
COPY --from=builder /app/node_modules               ./node_modules
COPY --from=builder /app/apps/api-server/node_modules ./apps/api-server/node_modules

# Persistent uploads directory
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
