# API Requirements And Credential Tracker

Last updated: 2026-05-29

Use this file as the single source of truth for all external credentials and integration keys.
When a new key is required, it must be added here first before implementation depends on it.

## How To Use This File

1. Add or update values in your local environment files (for example backend `.env`).
2. Keep real secret values out of git history when possible.
3. Update the `Status` column whenever a key becomes available.
4. Keep `Purpose` and `Used By` clear so setup is self-service and no follow-up is needed.

## Backend Integration Keys

| Key | Required For | Purpose | Where To Get It | Where To Set It | Used By | Status |
|---|---|---|---|---|---|---|
| `STRAPI_URL` | Medusa <-> Strapi sync runtime | Base URL of Strapi API for sync read/write calls | Your Strapi host address (local/prod), for local usually `http://localhost:1337` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/strapi-client.ts`, `src/lib/sync/worker.ts` | Pending |
| `STRAPI_API_TOKEN` | Medusa -> Strapi content writes | Authenticates Content API calls to create/update `product-enrichment` entries | Strapi Admin -> `Settings` -> `API Tokens` -> `Create new API Token` (`Custom` scope with `find`, `findOne`, `create`, `update` on `product-enrichment`) | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/strapi-client.ts` | Pending |
| `STRAPI_WEBHOOK_SECRET` | Strapi -> Medusa webhook security | Verifies webhook authenticity before accepting sync events | Generate your own strong secret and set same value on both Strapi webhook header and backend env | `golvfabriken-backend/apps/backend/.env` and Strapi webhook header `x-strapi-webhook-secret` | `src/api/integrations/strapi/webhooks/route.ts` | Pending |
| `SYNC_ADMIN_SECRET` | Sync operations API security | Protects failed/recent event listing, replay, and sync status endpoints | Generate your own strong secret | `golvfabriken-backend/apps/backend/.env` | `src/api/integrations/sync/events/failed/route.ts`, `src/api/integrations/sync/events/recent/route.ts`, `src/api/integrations/sync/events/replay/route.ts`, `src/api/integrations/sync/status/route.ts` | Pending |
| `SYNC_JOB_BATCH_SIZE` | Sync worker throughput | Controls number of events processed per sync job run | Internal configuration (choose based on load), recommended start `25` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_MAX_ATTEMPTS` | Retry/dead-letter control | Max retry attempts before event is marked dead-letter | Internal configuration, recommended start `5` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/lib/sync/worker.ts` | Default Available |
| `SYNC_JOB_CONCURRENCY` | Sync worker throughput scaling | Number of events processed in parallel per worker run (safe default `1`) | Internal configuration, recommended start `1` and increase gradually | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/lib/sync/worker.ts` | Default Available |
| `SYNC_JOB_DISTRIBUTED_LOCK` | Multi-instance safety | Enables distributed job lease lock so only one sync job run executes at a time | Internal toggle, recommended `true` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_LOCK_KEY` | Distributed lock namespacing | Redis key used for sync job lease lock | Internal configuration, recommended `sync:events:job-lock` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_JOB_LOCK_TTL_SECONDS` | Distributed lock lease timeout | Lease TTL for sync job lock to prevent dead locks after crashes | Internal configuration, recommended `120` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_PROCESSING_STALE_AFTER_SECONDS` | Worker crash recovery lease timeout | Time window before a `processing` event is considered stuck and recovered | Internal configuration, recommended start `600` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_PROCESSING_RECOVERY_LIMIT` | Worker crash recovery scan size | Max `processing` events scanned per job run for lease-timeout recovery | Internal configuration, recommended start `100` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_USE_REDIS_QUEUE` | Queue mode control | Enables Redis queue-first processing (`true`) or DB polling fallback (`false`) | Internal toggle, recommended start `true` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_QUEUE_KEY` | Redis queue naming | Redis list key used for sync event IDs | Internal configuration, recommended `sync:events:queue` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_INVALIDATION_URL` | Storefront cache invalidation | Endpoint called after successful sync to revalidate cache | Storefront/API endpoint that handles invalidation events | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Pending |
| `SYNC_INVALIDATION_SECRET` | Cache invalidation security | Shared secret for invalidation endpoint auth | Generate your own strong secret (must match receiver validation logic) | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Pending |
| `SYNC_INVALIDATION_TIMEOUT_MS` | Invalidation request robustness | Timeout for invalidation webhook call | Internal configuration, recommended start `4000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Default Available |
| `SYNC_DISABLE_STRAPI_WRITES` | Local development mode without Strapi token/URL | Temporarily skips Medusa -> Strapi outbound writes while keeping event pipeline development active | Internal toggle (`true`/`false`), use `true` locally until Strapi credentials are ready | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/worker.ts` | Recommended Local `true` |

## Immediate Local Setup Recommendation

For local development before Strapi credentials are ready:

```env
SYNC_DISABLE_STRAPI_WRITES=true
SYNC_JOB_BATCH_SIZE=25
SYNC_JOB_MAX_ATTEMPTS=5
SYNC_JOB_CONCURRENCY=1
SYNC_JOB_DISTRIBUTED_LOCK=true
SYNC_JOB_LOCK_KEY=sync:events:job-lock
SYNC_JOB_LOCK_TTL_SECONDS=120
SYNC_PROCESSING_STALE_AFTER_SECONDS=600
SYNC_PROCESSING_RECOVERY_LIMIT=100
SYNC_USE_REDIS_QUEUE=true
SYNC_QUEUE_KEY=sync:events:queue
```

Then later, once Strapi is ready:

```env
SYNC_DISABLE_STRAPI_WRITES=false
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<your_token>
STRAPI_WEBHOOK_SECRET=<shared_secret>
```
