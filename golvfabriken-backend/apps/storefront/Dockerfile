# syntax=docker/dockerfile:1.7
# TanStack Start storefront (SSR, node-server preset).
# Build context: ./golvfabriken-backend/apps/storefront  (standalone, NOT the workspace
# root — avoids the backend's vite@5 colliding with the storefront's vite@7).

# ---------- 1. deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
# @medusajs/icons peer-deps React 19.2.5 vs project's 19.1.1 — known harmless conflict.
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ---------- 2. build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_MEDUSA_BACKEND_URL
ARG VITE_MEDUSA_PUBLISHABLE_KEY
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL \
    VITE_MEDUSA_PUBLISHABLE_KEY=$VITE_MEDUSA_PUBLISHABLE_KEY

RUN npm run build

# ---------- 3. runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat curl tini
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

# TanStack Start vite plugin emits dist/server/server.js (a Web Fetch handler)
# + dist/client/ static assets. server-entry.mjs wraps the handler in node:http.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server-entry.mjs ./server-entry.mjs

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/ || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","server-entry.mjs"]
