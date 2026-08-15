# API Requirements And Credential Tracker

Last updated: 2026-05-31

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
| `SYNC_ADMIN_SECRET` | Sync operations API security | Protects failed/recent listing, replay, sync status, queue operations, and manual process endpoints | Generate your own strong secret | `golvfabriken-backend/apps/backend/.env` | `src/api/integrations/sync/events/failed/route.ts`, `src/api/integrations/sync/events/recent/route.ts`, `src/api/integrations/sync/events/replay/route.ts`, `src/api/integrations/sync/status/route.ts`, `src/api/integrations/sync/queue/*`, `src/api/integrations/sync/jobs/process-once/route.ts` | Pending |
| `OPS_ADMIN_SECRET` | Ops API security | Protects complaint/return/import/tax/integration admin operation routes | Generate your own strong secret | `golvfabriken-backend/apps/backend/.env` | `src/api/admin/ops/**/*` | Pending |
| `OPS_INTEGRATION_SIMULATION_MODE` | Local integration preview mode | Enables simulated shipping/payment/accounting preview responses when external API keys are unavailable | Internal toggle (`true`/`false`), default `true` for local development | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, `src/api/admin/ops/**/*`, `src/api/store/checkout/**/*` | Default Available |
| `OPS_MERCHANT_COUNTRY_CODE` | Tax/VAT preview runtime | Sets merchant country context for reverse-charge decisioning in tax quote preview flows (default `SE`) | Internal configuration (`SE` for Golvfabriken baseline) | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/tax-runtime.ts`, `src/api/admin/ops/tax-configurations/quote-preview/route.ts`, `src/api/store/checkout/tax/quote-preview/route.ts` | Default Available |
| `OPS_PRIVACY_ANONYMIZE_SALT` | Privacy anonymization workflow | Salt used for deterministic anonymized customer/email identifiers in GDPR privacy request anonymization flow | Internal generated secret value (use a long random string) | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/privacy-runtime.ts`, `src/modules/ops/service.ts`, `src/api/admin/ops/privacy/requests/anonymize/route.ts` | Default Available |
| `FRAKTJAKT_API_URL` | Fraktjakt shipping integration | Base URL for Fraktjakt API (shipping rates/booking/tracking) | Fraktjakt merchant/integration onboarding docs | `golvfabriken-backend/apps/backend/.env` | Planned integration paths (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `FRAKTJAKT_API_KEY` | Fraktjakt shipping integration | API key/credential used to authenticate Fraktjakt requests | Fraktjakt merchant/integration onboarding portal | `golvfabriken-backend/apps/backend/.env` | Planned integration paths (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `FRAKTJAKT_RATE_PATH` | Fraktjakt rate quote endpoint path | Relative API path used for live shipping quote requests | Fraktjakt API documentation for your account | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping quote endpoints | Default Available |
| `FRAKTJAKT_RATE_TIMEOUT_MS` | Fraktjakt live request timeout | Timeout (ms) before shipping quote call falls back to simulation/skip behavior | Internal configuration, recommended `4000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping quote endpoints | Default Available |
| `FRAKTJAKT_BOOKING_PATH` | Fraktjakt shipment booking endpoint path | Relative API path used for shipment booking after checkout | Fraktjakt API documentation for your account | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping booking endpoints | Default Available |
| `FRAKTJAKT_BOOKING_TIMEOUT_MS` | Fraktjakt booking request timeout | Timeout (ms) before booking call falls back to simulation/skip behavior | Internal configuration, recommended `5000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping booking endpoints | Default Available |
| `FRAKTJAKT_LABEL_PATH` | Fraktjakt label endpoint path | Relative API path template for label generation (`{shipment_id}` placeholder) | Fraktjakt API documentation for your account | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping label endpoints | Default Available |
| `FRAKTJAKT_LABEL_TIMEOUT_MS` | Fraktjakt label request timeout | Timeout (ms) before label call falls back to simulation/skip behavior | Internal configuration, recommended `5000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping label endpoints | Default Available |
| `FRAKTJAKT_TRACKING_PATH` | Fraktjakt tracking endpoint path | Relative API path template for shipment tracking (`{shipment_id}` placeholder) | Fraktjakt API documentation for your account | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping tracking endpoints | Default Available |
| `FRAKTJAKT_TRACKING_TIMEOUT_MS` | Fraktjakt tracking request timeout | Timeout (ms) before tracking call falls back to simulation/skip behavior | Internal configuration, recommended `4000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping tracking endpoints | Default Available |
| `FRAKTJAKT_ADDRESS_VALIDATE_PATH` | Fraktjakt address validation endpoint path | Relative API path used to validate/normalize shipping address before booking | Fraktjakt API documentation for your account | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping address-validate endpoints | Default Available |
| `FRAKTJAKT_ADDRESS_VALIDATE_TIMEOUT_MS` | Fraktjakt address validation timeout | Timeout (ms) before address validation call falls back to simulation/skip behavior | Internal configuration, recommended `3000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, shipping address-validate endpoints | Default Available |
| `KLARNA_API_BASE_URL` | Klarna payment integration | Klarna API environment base URL (test/prod) | Klarna merchant account and docs | `golvfabriken-backend/apps/backend/.env` | Planned payment provider integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `KLARNA_USERNAME` | Klarna payment integration | Klarna API username for server-side API auth | Klarna merchant portal (API credentials) | `golvfabriken-backend/apps/backend/.env` | Planned payment provider integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `KLARNA_PASSWORD` | Klarna payment integration | Klarna API password/secret for server-side API auth | Klarna merchant portal (API credentials) | `golvfabriken-backend/apps/backend/.env` | Planned payment provider integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `KLARNA_SESSION_PATH` | Klarna session endpoint path | Relative API path used for live payment session creation | Klarna payments API docs (`/payments/v1/sessions` default) | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna session endpoints | Default Available |
| `KLARNA_SESSION_TIMEOUT_MS` | Klarna live request timeout | Timeout (ms) before Klarna session call falls back to simulation/skip behavior | Internal configuration, recommended `5000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna session endpoints | Default Available |
| `KLARNA_ORDER_CREATE_PATH` | Klarna order creation endpoint path | Relative API path template for order creation from authorization (`{authorization_token}` placeholder) | Klarna payments API docs | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna order endpoints | Default Available |
| `KLARNA_ORDER_TIMEOUT_MS` | Klarna order creation request timeout | Timeout (ms) before order creation call falls back to simulation/skip behavior | Internal configuration, recommended `6000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna order endpoints | Default Available |
| `KLARNA_CAPTURE_PATH` | Klarna capture endpoint path | Relative API path template for capture actions (`{order_id}` placeholder) | Klarna order management API docs | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna capture endpoints | Default Available |
| `KLARNA_CAPTURE_TIMEOUT_MS` | Klarna capture request timeout | Timeout (ms) before capture call falls back to simulation/skip behavior | Internal configuration, recommended `6000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna capture endpoints | Default Available |
| `KLARNA_REFUND_PATH` | Klarna refund endpoint path | Relative API path template for refund actions (`{order_id}` placeholder) | Klarna order management API docs | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna refund endpoints | Default Available |
| `KLARNA_REFUND_TIMEOUT_MS` | Klarna refund request timeout | Timeout (ms) before refund call falls back to simulation/skip behavior | Internal configuration, recommended `6000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/ops/integration-runtime.ts`, klarna refund endpoints | Default Available |
| `FORTNOX_API_BASE_URL` | Fortnox accounting integration | Base URL for Fortnox APIs | Fortnox developer docs | `golvfabriken-backend/apps/backend/.env` | Planned accounting sync integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `FORTNOX_CLIENT_ID` | Fortnox accounting integration | OAuth client ID for Fortnox app authorization | Fortnox developer portal | `golvfabriken-backend/apps/backend/.env` | Planned accounting sync integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `FORTNOX_CLIENT_SECRET` | Fortnox accounting integration | OAuth client secret for Fortnox app authorization | Fortnox developer portal | `golvfabriken-backend/apps/backend/.env` | Planned accounting sync integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `FORTNOX_ACCESS_TOKEN` | Fortnox accounting integration | Access token used to call Fortnox APIs | Fortnox OAuth authorization flow | `golvfabriken-backend/apps/backend/.env` | Planned accounting sync integration (currently tracked through `ops_integration_connector`) | SKIP (No Key Yet) |
| `SYNC_JOB_DISABLED` | Scheduled job lifecycle control | Disables cron-triggered sync job while allowing manual/daemon execution paths | Internal toggle, recommended `true` when daemon process is active | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_BATCH_SIZE` | Sync worker throughput | Controls number of events processed per sync job run | Internal configuration (choose based on load), recommended start `25` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_MAX_ATTEMPTS` | Retry/dead-letter control | Max retry attempts before event is marked dead-letter | Internal configuration, recommended start `5` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/lib/sync/worker.ts` | Default Available |
| `SYNC_JOB_CONCURRENCY` | Sync worker throughput scaling | Number of events processed in parallel per worker run (safe default `1`) | Internal configuration, recommended start `1` and increase gradually | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/lib/sync/worker.ts` | Default Available |
| `SYNC_JOB_DISTRIBUTED_LOCK` | Multi-instance safety | Enables distributed job lease lock so only one sync job run executes at a time | Internal toggle, recommended `true` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_LOCK_KEY` | Distributed lock namespacing | Redis key used for sync job lease lock | Internal configuration, recommended `sync:events:job-lock` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_JOB_LOCK_TTL_SECONDS` | Distributed lock lease timeout | Lease TTL for sync job lock to prevent dead locks after crashes | Internal configuration, recommended `120` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_JOB_CONTINUOUS_ENABLED` | Continuous worker runtime mode | Keeps each scheduled sync job run active in a short loop to continuously drain queue | Internal toggle, default `false` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_CONTINUOUS_MAX_RUNTIME_MS` | Continuous loop runtime budget | Max runtime per job invocation when continuous mode is enabled | Internal configuration, recommended `55000` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_CONTINUOUS_IDLE_SLEEP_MS` | Continuous loop idle backoff | Sleep between cycles when no events were selected | Internal configuration, recommended `1000` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_CONTINUOUS_ACTIVE_SLEEP_MS` | Continuous loop active pacing | Optional sleep between active cycles while work exists | Internal configuration, recommended `0` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_JOB_CONTINUOUS_MAX_IDLE_ITERATIONS` | Continuous loop stop condition | Max consecutive idle cycles before loop exits early | Internal configuration, recommended `5` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_DAEMON_POLL_INTERVAL_MS` | Standalone daemon loop pacing | Delay between standalone daemon cycles | Internal configuration, recommended `500` | `golvfabriken-backend/apps/backend/.env` | `src/scripts/sync-worker-daemon.ts` | Default Available |
| `SYNC_DAEMON_ERROR_SLEEP_MS` | Standalone daemon retry backoff | Delay after a daemon cycle error before retry | Internal configuration, recommended `3000` | `golvfabriken-backend/apps/backend/.env` | `src/scripts/sync-worker-daemon.ts` | Default Available |
| `SYNC_DAEMON_HEARTBEAT_INTERVAL_MS` | Standalone daemon observability | Heartbeat log interval for daemon loop | Internal configuration, recommended `30000` | `golvfabriken-backend/apps/backend/.env` | `src/scripts/sync-worker-daemon.ts` | Default Available |
| `SYNC_DAEMON_FORCE_CONTINUOUS` | Standalone daemon execution mode | Forces each daemon cycle to use continuous job runtime behavior | Internal toggle, recommended `true` | `golvfabriken-backend/apps/backend/.env` | `src/scripts/sync-worker-daemon.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_DAEMON_CONTINUOUS_MAX_RUNTIME_MS` | Standalone daemon cycle runtime budget | Continuous runtime budget used by daemon per cycle | Internal configuration, recommended `55000` | `golvfabriken-backend/apps/backend/.env` | `src/scripts/sync-worker-daemon.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_RECONCILE_JOB_ENABLED` | Scheduled reconciliation lifecycle | Enables periodic sync mapping reconciliation job | Internal toggle, recommended `false` until desired in ops | `golvfabriken-backend/apps/backend/.env` | `src/jobs/reconcile-sync-mappings.ts` | Default Available |
| `SYNC_RECONCILE_SCAN_LIMIT` | Reconciliation scan window | Number of mapping rows scanned per scheduled reconciliation run | Internal configuration, recommended `2000` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/reconcile-sync-mappings.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_RECONCILE_MARK_CONFLICT` | Reconciliation conflict behavior | Marks detected duplicate/invalid mappings as `conflict` during scheduled reconcile | Internal toggle, recommended `true` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/reconcile-sync-mappings.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_PROCESSING_STALE_AFTER_SECONDS` | Worker crash recovery lease timeout | Time window before a `processing` event is considered stuck and recovered | Internal configuration, recommended start `600` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_PROCESSING_RECOVERY_LIMIT` | Worker crash recovery scan size | Max `processing` events scanned per job run for lease-timeout recovery | Internal configuration, recommended start `100` | `golvfabriken-backend/apps/backend/.env` | `src/jobs/process-sync-events.ts`, `src/modules/sync/service.ts` | Default Available |
| `SYNC_USE_REDIS_QUEUE` | Queue mode control | Enables Redis queue-first processing (`true`) or DB polling fallback (`false`) | Internal toggle, recommended start `true` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_QUEUE_KEY` | Redis queue naming | Redis list key used for sync event IDs | Internal configuration, recommended `sync:events:queue` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_QUEUE_PROCESSING_KEY` | Reliable queue processing list key | Redis processing list used for in-flight sync event IDs | Internal configuration, recommended `sync:events:queue:processing` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_QUEUE_PROCESSING_META_KEY` | In-flight visibility metadata key | Redis hash key storing in-flight timestamps for visibility-timeout recovery | Internal configuration, recommended `sync:events:queue:processing:meta` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_QUEUE_PAUSE_KEY` | Queue operation control key | Redis hash key used to pause/resume dequeue processing safely | Internal configuration, recommended `sync:events:queue:paused` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts` | Default Available |
| `SYNC_QUEUE_VISIBILITY_TIMEOUT_SECONDS` | Per-message visibility timeout | Staleness threshold for in-flight queue recovery when worker crashes | Internal configuration, recommended `300` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_QUEUE_STALE_RECOVERY_LIMIT` | In-flight recovery batch size | Max stale in-flight queue entries recovered per job run | Internal configuration, recommended `100` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/queue.ts`, `src/jobs/process-sync-events.ts` | Default Available |
| `SYNC_INVALIDATION_URL` | Storefront cache invalidation | Endpoint called after successful sync to revalidate cache | Storefront/API endpoint that handles invalidation events | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Pending |
| `SYNC_INVALIDATION_SECRET` | Cache invalidation security | Shared secret for invalidation endpoint auth | Generate your own strong secret (must match receiver validation logic) | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Pending |
| `SYNC_INVALIDATION_TIMEOUT_MS` | Invalidation request robustness | Timeout for invalidation webhook call | Internal configuration, recommended start `4000` | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/cache-invalidation.ts` | Default Available |
| `SYNC_DISABLE_STRAPI_WRITES` | Local development mode without Strapi token/URL | Temporarily skips Medusa -> Strapi outbound writes while keeping event pipeline development active | Internal toggle (`true`/`false`), use `true` locally until Strapi credentials are ready | `golvfabriken-backend/apps/backend/.env` | `src/lib/sync/worker.ts` | Recommended Local `true` |

## Immediate Local Setup Recommendation

For local development before Strapi credentials are ready:

```env
OPS_INTEGRATION_SIMULATION_MODE=true
OPS_MERCHANT_COUNTRY_CODE=SE
OPS_PRIVACY_ANONYMIZE_SALT=<generate_random_secret>
FRAKTJAKT_RATE_PATH=/shipping/v1/quotes
FRAKTJAKT_RATE_TIMEOUT_MS=4000
FRAKTJAKT_BOOKING_PATH=/shipping/v1/bookings
FRAKTJAKT_BOOKING_TIMEOUT_MS=5000
FRAKTJAKT_LABEL_PATH=/shipping/v1/shipments/{shipment_id}/label
FRAKTJAKT_LABEL_TIMEOUT_MS=5000
FRAKTJAKT_TRACKING_PATH=/shipping/v1/shipments/{shipment_id}/tracking
FRAKTJAKT_TRACKING_TIMEOUT_MS=4000
FRAKTJAKT_ADDRESS_VALIDATE_PATH=/shipping/v1/address/validate
FRAKTJAKT_ADDRESS_VALIDATE_TIMEOUT_MS=3000
KLARNA_SESSION_PATH=/payments/v1/sessions
KLARNA_SESSION_TIMEOUT_MS=5000
KLARNA_ORDER_CREATE_PATH=/payments/v1/authorizations/{authorization_token}/order
KLARNA_ORDER_TIMEOUT_MS=6000
KLARNA_CAPTURE_PATH=/ordermanagement/v1/orders/{order_id}/captures
KLARNA_CAPTURE_TIMEOUT_MS=6000
KLARNA_REFUND_PATH=/ordermanagement/v1/orders/{order_id}/refunds
KLARNA_REFUND_TIMEOUT_MS=6000
SYNC_DISABLE_STRAPI_WRITES=true
SYNC_JOB_DISABLED=false
SYNC_JOB_BATCH_SIZE=25
SYNC_JOB_MAX_ATTEMPTS=5
SYNC_JOB_CONCURRENCY=1
SYNC_JOB_DISTRIBUTED_LOCK=true
SYNC_JOB_LOCK_KEY=sync:events:job-lock
SYNC_JOB_LOCK_TTL_SECONDS=120
SYNC_JOB_CONTINUOUS_ENABLED=false
SYNC_JOB_CONTINUOUS_MAX_RUNTIME_MS=55000
SYNC_JOB_CONTINUOUS_IDLE_SLEEP_MS=1000
SYNC_JOB_CONTINUOUS_ACTIVE_SLEEP_MS=0
SYNC_JOB_CONTINUOUS_MAX_IDLE_ITERATIONS=5
SYNC_DAEMON_POLL_INTERVAL_MS=500
SYNC_DAEMON_ERROR_SLEEP_MS=3000
SYNC_DAEMON_HEARTBEAT_INTERVAL_MS=30000
SYNC_DAEMON_FORCE_CONTINUOUS=true
SYNC_DAEMON_CONTINUOUS_MAX_RUNTIME_MS=55000
SYNC_RECONCILE_JOB_ENABLED=false
SYNC_RECONCILE_SCAN_LIMIT=2000
SYNC_RECONCILE_MARK_CONFLICT=true
SYNC_PROCESSING_STALE_AFTER_SECONDS=600
SYNC_PROCESSING_RECOVERY_LIMIT=100
SYNC_USE_REDIS_QUEUE=true
SYNC_QUEUE_KEY=sync:events:queue
SYNC_QUEUE_PROCESSING_KEY=sync:events:queue:processing
SYNC_QUEUE_PROCESSING_META_KEY=sync:events:queue:processing:meta
SYNC_QUEUE_PAUSE_KEY=sync:events:queue:paused
SYNC_QUEUE_VISIBILITY_TIMEOUT_SECONDS=300
SYNC_QUEUE_STALE_RECOVERY_LIMIT=100
```

Then later, once Strapi is ready:

```env
SYNC_DISABLE_STRAPI_WRITES=false
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<your_token>
STRAPI_WEBHOOK_SECRET=<shared_secret>
```

## Update Notes

- 2026-05-31: Added B2B checkout context endpoint (`/store/b2b/checkout/context`) and storefront depot-dropdown/context-sync wiring. No new external API key required.
- 2026-05-31: Added storefront B2B approval-gate orchestration (checkout approval submit + payment method filtering policy via cart metadata). No new external API key required.
- 2026-05-31: Added backend flooring coverage/m2 calculation APIs (`/store/checkout/flooring/coverage`, `/admin/ops/flooring/coverage`) and checkout delivery-step address-validation wiring. No new external API key required.
- 2026-05-31: Added Fraktjakt address validation runtime + endpoints (`/admin/ops/shipping/address-validate`, `/store/checkout/shipping/address-validate`) and related env path/timeout keys.
- 2026-05-31: Added live-ready Fraktjakt and Klarna runtime execution with timeout + simulation fallback behavior. No new external provider key was required; added endpoint-path and timeout configs.
- 2026-05-31: Added B2B backend foundation (company/user/approval/RFQ module and routes). No new external provider API key was required for this phase.
- 2026-05-30: Added audit/privacy/reporting ops phase (`ops_audit_log`, `ops_privacy_request`, privacy export/anonymize routes, and ops summary CSV export). No new external provider key was required; added internal key `OPS_PRIVACY_ANONYMIZE_SALT`.
- 2026-05-30: Added import execution/report and tax quote preview runtime support. No new external provider key was required; added internal runtime config `OPS_MERCHANT_COUNTRY_CODE`.
- 2026-05-30: No new API keys were added for the ownership edge-case phase (`price_list` + `reservation_item` handlers).
- 2026-05-30: Added `OPS_ADMIN_SECRET` and planned Fraktjakt/Klarna/Fortnox credential keys. Marked as `SKIP (No Key Yet)` until integration credentials are provided.
- 2026-05-30: Added `OPS_INTEGRATION_SIMULATION_MODE` and integration health/preview runtime flow so shipping/payment/accounting can be tested while provider keys remain in SKIP mode.
