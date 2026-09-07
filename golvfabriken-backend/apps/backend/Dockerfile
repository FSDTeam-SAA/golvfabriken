# syntax=docker/dockerfile:1.7
# Medusa v2 backend (also reused for the worker — different MEDUSA_WORKER_MODE env).
# Build context: ./golvfabriken-backend (the turborepo workspace root).

# ---------- 1. deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace

COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/storefront/package.json apps/storefront/
RUN npm ci --no-audit --no-fund

# ---------- 2. build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY . .
WORKDIR /workspace/apps/backend
# medusa-config.ts reads these at build-time via loadEnv; provide placeholder values so
# `medusa build` does not crash when real env vars are absent from the build environment.
ENV STORE_CORS="http://localhost:8000" \
    ADMIN_CORS="http://localhost:9000" \
    AUTH_CORS="http://localhost:8000,http://localhost:9000"
RUN npx medusa build

# ---------- 3. runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat curl tini
# Medusa v2's `medusa build` produces a self-contained deployable app under
# .medusa/server (its own package.json + compiled medusa-config.js + src).
# That directory — not the project root — is what must be run in production.
WORKDIR /app

ENV NODE_ENV=production \
    PORT=9000 \
    MEDUSA_WORKER_MODE=server

COPY --from=build /workspace/apps/backend/.medusa/server ./
COPY --from=build /workspace/apps/backend/node_modules ./node_modules
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:9000/health || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["npx","medusa","start"]