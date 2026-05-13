FROM node:24-alpine AS base
RUN npm install -g pnpm@10.26.1

# ── Builder ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY lib/db/package.json                  lib/db/
COPY lib/api-spec/package.json            lib/api-spec/
COPY lib/api-zod/package.json             lib/api-zod/
COPY lib/api-client-react/package.json    lib/api-client-react/
COPY artifacts/api-server/package.json    artifacts/api-server/
COPY artifacts/finance-app/package.json   artifacts/finance-app/

RUN pnpm install --frozen-lockfile

# Copy all source
COPY . .

# 1. Build shared libs (composite TypeScript)
RUN pnpm run typecheck:libs

# 2. Build frontend (BASE_PATH=/ means served from root on Fly.io)
RUN PORT=3000 BASE_PATH=/ NODE_ENV=production \
    pnpm --filter @workspace/finance-app run build

# 3. Build API server
RUN pnpm --filter @workspace/api-server run build

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

# Copy built API
COPY --from=builder /app/artifacts/api-server/dist ./dist

# Copy built frontend static files
COPY --from=builder /app/artifacts/finance-app/dist/public ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
