# syntax=docker/dockerfile:1.7
# Strapi v4 CMS. Build context: ./golvfabriken-cms
# Base = node:20-bookworm-slim (Debian) because sharp ships prebuilt glibc binaries
# but no musl ones — Alpine fails on first request that touches images.

# ---------- 1. deps (full, including devDeps for admin build) ----------
FROM node:20-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ libvips-dev curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
# package.json was modified (added R2 upload provider) — install fresh.
RUN npm install --no-audit --no-fund

# ---------- 2. build (NODE_ENV unset so admin panel actually compiles) ----------
FROM node:20-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ libvips-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. runtime ----------
FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      libvips42 curl tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/config ./config
COPY --from=build /app/database ./database
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/types ./types
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/.strapi ./.strapi
COPY --from=build /app/favicon.png ./favicon.png
RUN npm prune --omit=dev --no-audit --no-fund

EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:1337/_health || exit 1

ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["npm","run","start"]
