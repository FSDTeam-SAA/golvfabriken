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

### Admin credentials
| What | Where | Login |
|---|---|---|
| Medusa admin (prod) | `https://admin.golvfabriken.se/app` | `admin@golvfabriken.se` / `Admin1234!` |
| Medusa admin (staging) | `https://api.staging.golvfabriken.se/app` | `admin@golvfabriken.se` / `Admin1234!` |
| Strapi admin (prod) | `https://cms.golvfabriken.se/admin` | created on first visit |
| Strapi admin (staging) | `https://cms.staging.golvfabriken.se/admin` | created on first visit |

**Rotate `Admin1234!` immediately.** Use `npx medusa user` to change it (see ops cheatsheet below).

### Publishable API keys (already baked into storefront builds)
- Prod: `pk_6021ef3b1f14b1df92f601585d7f28fce7bd2e903c6b0688d64fb548d4cc26b1`
- Staging: `pk_2126e80792b3ceacb0c1b4d0ffec86f63d77b53f914f6f4cc87607c27a91c5d6`

Both are linked to their respective default sales channels. Managed at
Medusa admin → Settings → Publishable API Keys.

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

### Restoring a backup — full runbook

The pipeline is `pg_dump | gzip | openssl aes-256-cbc -pbkdf2 -iter 200000`. To
restore, reverse those steps.

You will need:
- `BACKUP_ENCRYPTION_KEY` from Bitwarden item `golvfabriken-backup-encryption-key`
- R2 credentials (already on the VPS at `/srv/golvfabriken/backup/.env`)
- The target Postgres up and reachable

#### 1. List available backups
```bash
ssh deploy@204.168.170.60
docker run --rm \
  -e AWS_ACCESS_KEY_ID=$(grep R2_ACCESS_KEY_ID /srv/golvfabriken/backup/.env | cut -d= -f2) \
  -e AWS_SECRET_ACCESS_KEY=$(grep R2_SECRET_ACCESS_KEY /srv/golvfabriken/backup/.env | cut -d= -f2) \
  amazon/aws-cli --endpoint-url=$(grep R2_ENDPOINT /srv/golvfabriken/backup/.env | cut -d= -f2) \
  s3 ls s3://golvfabriken-backups/ | sort
```

Filenames are `<env>_<db>_<UTC-timestamp>.sql.gz.enc`. Pick the newest acceptable one.

#### 2. Download the chosen dump to the VPS
```bash
KEY=prod_medusa_db_20260528T164723Z.sql.gz.enc
docker run --rm -v /tmp:/data \
  -e AWS_ACCESS_KEY_ID=$(grep R2_ACCESS_KEY_ID /srv/golvfabriken/backup/.env | cut -d= -f2) \
  -e AWS_SECRET_ACCESS_KEY=$(grep R2_SECRET_ACCESS_KEY /srv/golvfabriken/backup/.env | cut -d= -f2) \
  amazon/aws-cli --endpoint-url=$(grep R2_ENDPOINT /srv/golvfabriken/backup/.env | cut -d= -f2) \
  s3 cp s3://golvfabriken-backups/$KEY /data/$KEY
```

#### 3. Stop Medusa (so nothing writes during restore)
```bash
cd /srv/golvfabriken/prod
docker compose -f docker-compose.prod.yml --env-file .env stop medusa-backend medusa-worker
```

#### 4. Decrypt + decompress + pipe into Postgres
```bash
# Load the encryption key from Bitwarden into an env var first:
export BACKUP_ENCRYPTION_KEY='<paste from Bitwarden>'

openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -pass env:BACKUP_ENCRYPTION_KEY \
    -in /tmp/$KEY \
  | gunzip \
  | docker exec -i postgres-prod psql -U golvfabriken -d medusa_db
```

The dump was taken with `--clean --if-exists`, so it drops existing tables before
restoring — safe to run against a populated DB (data is replaced, not appended).

#### 5. Bring Medusa back up
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

#### 6. Sanity-check
```bash
docker exec medusa-backend curl -fsS http://127.0.0.1:9000/health
docker exec postgres-prod psql -U golvfabriken -d medusa_db -c "select count(*) from product;"
```

#### Restoring Strapi instead
Substitute `medusa_db` → `golvfabriken_cms` in the filename and the `psql` target.
Stop `strapi` (not Medusa) during the restore.

#### Restoring to staging
Substitute `prod` → `staging` and `postgres-prod` → `postgres-staging`. Compose file
is `docker-compose.staging.yml` in `/srv/golvfabriken/staging/`.

#### Restoring on a fresh VPS (DR scenario)
1. Run `deploy/bootstrap.sh` on the new server.
2. Restore the secrets directory (`.env` files) from Bitwarden onto the new VPS.
3. Pull GHCR images (or rebuild locally — same Dockerfiles work).
4. `docker compose up -d` postgres+redis first; wait for healthy.
5. Restore each DB via steps 1-4 above before starting Medusa/Strapi.
6. `docker compose up -d` the rest.

## R2 (Cloudflare object storage)
- `golvfabriken-production` — Strapi media for prod
- `golvfabriken-staging` — Strapi media for staging
- `golvfabriken-backups` — DB backups
- API token is bucket-scoped (verified — cannot list other buckets in the account)

**Custom domains live** (configured in Cloudflare R2 dashboard):
- `https://media.golvfabriken.se` → `golvfabriken-production`
- `https://media-staging.golvfabriken.se` → `golvfabriken-staging`

Strapi `R2_PUBLIC_URL` is already pointed at these. Any file uploaded through the
Strapi media library will resolve from these CDN-edge-cached domains.

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

## Cloudflare WAF (enabled in CF dashboard)
- Security → Bots → **Bot Fight Mode** ON
- Security → WAF → **Cloudflare Managed Ruleset** enabled
- Security Level: Medium
- SSL/TLS: Full (strict), Always Use HTTPS, Automatic HTTPS Rewrites, Min TLS 1.2

## Known codebase limitations (not in deploy scope, but listed for your developer)

1. **Stripe** — currently a demo stub; `rk_live` key plugged in to satisfy boot env, but payments won't process. Client said Stripe is being replaced.
2. **Strapi ↔ Medusa product sync** — webhook receives but doesn't persist (per project document).
3. **Storefront customer login/register** — pages don't exist in storefront source.
4. **Seed data** — Medusa is seeded with demo T-shirts; replace with real flooring catalog when ready.

### Courtesy patch applied (not in original scope)
The storefront's `src/lib/utils/sdk.ts` was patched to use an internal Docker URL during SSR
(`MEDUSA_BACKEND_URL_INTERNAL`) and the public URL for client-side fetches. Without this,
SSR returned 500 because every page render did a public round-trip through Cloudflare.
The patch is ~10 lines and stable; if you refactor the SDK init, preserve the
`!isBrowser && process.env.MEDUSA_BACKEND_URL_INTERNAL` branch.

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
