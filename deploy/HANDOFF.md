# Golvfabriken — Deployment Handoff

## Server
- **Host**: `golvfabriken-prod` (Hetzner CPX32, hel1)
- **IP**: `204.168.170.60`
- **OS**: Ubuntu 24.04 LTS
- **SSH**: `ssh deploy@204.168.170.60` (key-only, root login disabled)
- **Hetzner backups**: enabled, daily, 7-day retention
- **Cost**: ~€21/mo (server €17.49 + backups €3.50)

## Hardening in place
- UFW: only 22/80/443 open
- fail2ban: active (default SSH protection)
- SSH: PasswordAuthentication=no, PermitRootLogin=no, key-only
- Unattended-upgrades: enabled (security patches only)
- Docker: log rotation 10MB×3, live-restore on, no public DB/Redis ports
- All app containers: `restart: unless-stopped`, healthchecks defined

## Application stack
Production and staging run on the same VPS, behind one shared Caddy proxy.

| Service | Prod container | Staging container | Internal port |
|---|---|---|---|
| Medusa backend | `medusa-backend` | `medusa-backend-staging` | 9000 |
| Medusa worker | `medusa-worker` | `medusa-worker-staging` | (no HTTP) |
| Strapi CMS | `strapi` | `strapi-staging` | 1337 |
| Storefront (TanStack Start) | `storefront` | `storefront-staging` | 8000 |
| Postgres 16 | `postgres-prod` | `postgres-staging` | 5432 (internal) |
| Redis 7 | `redis-prod` | `redis-staging` | 6379 (internal) |
| Caddy (shared) | `caddy` | — | 80/443 (public) |

Networks:
- `web` — public-facing, joined by Caddy + all app services from both stacks
- `golvfabriken-prod-internal` — DB/Redis isolation for prod
- `golvfabriken-staging-internal` — DB/Redis isolation for staging

## Public URLs (TLS via Let's Encrypt, DNS-01 through Cloudflare)
- `https://api.golvfabriken.se` — Medusa REST API
- `https://admin.golvfabriken.se/app` — Medusa admin panel
- `https://cms.golvfabriken.se/admin` — Strapi admin
- `https://staging.golvfabriken.se` — Storefront staging
- `https://api.staging.golvfabriken.se` — Medusa staging API
- `https://cms.staging.golvfabriken.se/admin` — Strapi staging admin

**Apex `golvfabriken.se` and `www` are intentionally NOT routed here yet** — those still point to the old Inleed host. Phase-2 cutover instructions below.

## File layout on the VPS
```
/srv/golvfabriken/
├── prod/                 # all prod compose + .env + code
│   ├── .env              # mode 600, owned by deploy
│   ├── docker-compose.prod.yml
│   ├── docker-compose.caddy.yml
│   ├── deploy/
│   ├── golvfabriken-backend/
│   └── golvfabriken-cms/
├── staging/              # same shape, staging .env
├── backup/
│   └── .env              # backup encryption key + R2 creds, mode 600
└── backups/              # local dump staging area (last 7 days)
```

## Secrets storage
All secrets generated and stored in Bitwarden (see items: `golvfabriken-prod-env`, `golvfabriken-staging-env`, `golvfabriken-backup-encryption-key`, `golvfabriken-gha-deploy-key`, `golvfabriken-vps`).

`.env` files on the VPS are mode 600 owned by the `deploy` user — never committed to git.

## CI/CD
GitHub Actions workflows at `.github/workflows/`:
- `deploy-production.yml` — triggers on push to `main`, builds 3 images, pushes to GHCR, SSH-deploys to `/srv/golvfabriken/prod`
- `deploy-staging.yml` — same for `staging` branch → `/srv/golvfabriken/staging`

**GitHub repo secrets required** before workflows can run (add at Settings → Secrets and variables → Actions):
| Name | Value |
|---|---|
| `VPS_HOST` | `204.168.170.60` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | the `gha_deploy_key` private key from Bitwarden |
| `PROD_VITE_MEDUSA_BACKEND_URL` | `https://api.golvfabriken.se` |
| `PROD_VITE_MEDUSA_PUBLISHABLE_KEY` | (PENDING — generate from Medusa admin → Settings → Publishable API Keys) |
| `STAGING_VITE_MEDUSA_BACKEND_URL` | `https://api.staging.golvfabriken.se` |
| `STAGING_VITE_MEDUSA_PUBLISHABLE_KEY` | (PENDING — same) |

First deploy was done locally on the VPS (faster smoke test). The pipeline is ready — first git push to `main` or `staging` triggers a full build + deploy cycle.

## Backups
- Cron: `17 3 * * *` (daily at 03:17 UTC) → `/usr/local/bin/pg-backup.sh`
- Backs up all 4 databases (prod medusa_db, prod golvfabriken_cms, staging × 2)
- Pipeline: `pg_dump | gzip | openssl aes-256-cbc -pbkdf2` → upload to R2 `golvfabriken-backups`
- Retention: 7 days local + 7 days in R2 (script self-prunes)
- Decryption key: in Bitwarden as `golvfabriken-backup-encryption-key`
- Log: `/var/log/pg-backup.log`
- Test run already done — 4 dumps in R2.

To restore a dump locally:
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_KEY \
  -in prod_medusa_db_<ts>.sql.gz.enc | gunzip | psql -U golvfabriken -d medusa_db
```

## R2 (Cloudflare object storage)
- `golvfabriken-production` — Strapi media for prod
- `golvfabriken-staging` — Strapi media for staging
- `golvfabriken-backups` — DB backups
- API token is bucket-scoped (verified — cannot list other buckets in the account)

**Recommended next step (not done — needs CF dashboard):**
Set up Cloudflare custom domain on each media bucket so Strapi serves images from:
- `https://media.golvfabriken.se` → `golvfabriken-production`
- `https://media-staging.golvfabriken.se` → `golvfabriken-staging`

This avoids exposing the raw account ID URL and gives CDN edge caching.

## Cloudflare DNS records added
| Subdomain | Type | Target | Proxy |
|---|---|---|---|
| api | A | 204.168.170.60 | 🟠 on |
| admin | A | 204.168.170.60 | 🟠 on |
| cms | A | 204.168.170.60 | 🟠 on |
| staging | A | 204.168.170.60 | 🟠 on |
| api.staging | A | 204.168.170.60 | 🟠 on |
| cms.staging | A | 204.168.170.60 | 🟠 on |

The 15 pre-existing A records, all AAAA/MX/TXT/SRV records were **not touched** — old site at Inleed is still serving `golvfabriken.se`, `www`, email, etc.

## Phase-2 apex cutover (when Johan signs off on the new site)
1. In `/srv/golvfabriken/prod/deploy/caddy/Caddyfile`, add back the apex+www block (commented note at the top explains how).
2. `docker compose -f docker-compose.caddy.yml --env-file .env.caddy restart caddy`
3. In Cloudflare DNS, edit `@` and `www` A records: change content from `86.106.25.10` → `204.168.170.60`. Also update AAAA records (or delete) since the new origin has a different IPv6.
4. Old Inleed site goes dark instantly. Coordinate timing.

## Cloudflare WAF (recommended, not done)
At the CF dashboard:
- Security → Bots → enable **Bot Fight Mode** (free)
- Security → WAF → enable **Cloudflare Managed Ruleset**
- Security → Settings → Security Level: Medium
- SSL/TLS → Edge Certificates: enable **Always Use HTTPS**, **Automatic HTTPS Rewrites**, set **Min TLS** to 1.2
- (Optional) Security → WAF → Rate-limit `/admin` and `/app` to 10 req/min/IP

## Known codebase limitations (not in deploy scope)
These are upstream code issues, not deployment problems. Listed for your developer:

1. **Storefront SSR fetch URL** — the storefront makes SSR fetches to `https://api.golvfabriken.se` from inside the container, causing a 500 on first render. Fix: use an internal URL (`http://medusa-backend:9000`) for `typeof window === "undefined"` paths, public URL for client. ~5-line change in the API SDK init.
2. **Stripe** — currently a demo stub; `rk_live` key plugged in to satisfy boot env, but payments won't process. Client said Stripe is being replaced.
3. **Strapi ↔ Medusa product sync** — webhook receives but doesn't persist (per CLAUDE.md).
4. **Storefront customer login/register** — pages don't exist.
5. **Seed data** — demo T-shirts, not real flooring catalog.

## Quick ops cheatsheet (on the VPS)

Show all containers:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Tail a service log:
```bash
docker logs -f medusa-backend
```

Restart a single service:
```bash
cd /srv/golvfabriken/prod
docker compose -f docker-compose.prod.yml --env-file .env restart strapi
```

Run a Medusa CLI command (e.g. create admin):
```bash
cd /srv/golvfabriken/prod
docker compose -f docker-compose.prod.yml --env-file .env exec medusa-backend \
  npx medusa user -e new@admin.com -p NewPassword!
```

Manually trigger a backup:
```bash
ENV_FILE=/srv/golvfabriken/backup/.env /usr/local/bin/pg-backup.sh
```

Hetzner snapshot (full VM, separate from pg_dump):
```bash
# Via Hetzner Cloud Console or API; daily snapshots already auto-created.
```
