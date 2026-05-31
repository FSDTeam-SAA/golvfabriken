# Medusa/Strapi Sync Foundation

This folder contains the shared synchronization contract for the Medusa/Strapi integration.

## Current Endpoint

Strapi should call:

```txt
POST /integrations/strapi/webhooks
```

Sync operators can use:

```txt
GET /integrations/sync/events/failed
GET /integrations/sync/events/recent
POST /integrations/sync/events/replay
GET /integrations/sync/status
GET /integrations/sync/queue/status
GET /integrations/sync/queue/pause
POST /integrations/sync/queue/pause
POST /integrations/sync/queue/recover
POST /integrations/sync/jobs/process-once
GET /integrations/sync/mappings/status
GET /integrations/sync/mappings/conflicts
POST /integrations/sync/mappings/reconcile
POST /integrations/sync/mappings/conflicts/resolve
```

Required header:

```txt
x-strapi-webhook-secret: <STRAPI_WEBHOOK_SECRET>
```

Optional headers:

```txt
x-strapi-event-id: <external event id>
x-correlation-id: <existing correlation id>
```

## Environment

Set this in the Medusa backend environment:

```txt
STRAPI_WEBHOOK_SECRET=replace_me
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=replace_me
SYNC_DISABLE_STRAPI_WRITES=true
SYNC_JOB_BATCH_SIZE=25
SYNC_JOB_MAX_ATTEMPTS=5
SYNC_JOB_CONCURRENCY=1
SYNC_JOB_DISABLED=false
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
SYNC_ADMIN_SECRET=replace_me
SYNC_INVALIDATION_URL=http://localhost:8000/api/sync/invalidate
SYNC_INVALIDATION_SECRET=replace_me
SYNC_INVALIDATION_TIMEOUT_MS=4000
```

## Current Behavior

- Validates the Strapi webhook secret.
- Normalizes incoming Strapi webhook payloads into the FRD sync event shape.
- Generates deterministic event IDs when Strapi does not provide one.
- Generates correlation IDs when the request does not provide one.
- Calculates a payload checksum for idempotency.
- Marks webhook echoes from integration writes as ignored (including Medusa-origin writes tagged via `sync_origin`).
- Persists webhook events in `sync_event`.
- Upserts Medusa/Strapi mappings in `sync_mapping`.
- Records duplicate webhook events as deduplicated responses.
- Subscribes to Medusa product/category/variant, pricing (`price`, `price_set`, `price_list`), and inventory (`inventory_item`, `inventory_level`, `reservation_item`) events and persists normalized Medusa-origin sync events.
- Runs scheduled job `sync-events-processor` every minute to process queued `sync_event` records.
- Supports configurable per-run worker concurrency via `SYNC_JOB_CONCURRENCY` (default `1`).
- Supports cron lifecycle control via `SYNC_JOB_DISABLED` and manual/daemon execution paths.
- Uses Redis-based distributed job lease lock to prevent overlapping sync-job runs across instances.
- Supports optional continuous worker mode in each job invocation to keep draining queue for a bounded runtime window.
- Recovers stale `processing` events using lease-timeout settings and requeues them when retryable.
- Uses reliable Redis queue semantics with in-flight processing list + ack/requeue flow.
- Recovers stale in-flight queue messages using visibility-timeout metadata.
- Processes Medusa -> Strapi product sync writes using ownership mappers.
- Processes Medusa product-variant events by syncing parent products to Strapi.
- Processes Medusa product-category events by syncing category-linked products to Strapi.
- Processes Medusa inventory-item/inventory-level/reservation-item events by resolving linked variants/products and syncing affected products to Strapi.
- Processes Medusa price/price-set/price-list events by resolving linked variants/products and syncing affected products to Strapi.
- Processes Strapi -> Medusa product update writes using ownership mappers.
- Retries failed events until `SYNC_JOB_MAX_ATTEMPTS`; when max attempts is reached, marks event as dead-lettered in `error_message`.
- Adds secure operator endpoints to list failed events and replay failed/dead-lettered events.
- Adds secure operator endpoints for sync observability: recent events list and queue/status counts.
- Adds secure queue-operations endpoints for pause/resume, stale recovery, and one-shot/manual processing.
- Adds secure mapping operations endpoints for reconciliation, conflict listing, and conflict resolution updates.
- Sends best-effort targeted cache invalidation webhook after successful product sync processing.
- Supports local mode without Strapi credentials using `SYNC_DISABLE_STRAPI_WRITES=true`.
- Enqueues new sync events into Redis and processes queue-first with reliable in-flight ack/requeue handling; DB polling remains fallback when queue is disabled.
- Includes optional scheduled mapping reconciliation job (`sync-mapping-reconcile`) for duplicate/invalid mapping drift detection.

## Standalone Worker Daemon

Run dedicated daemon-style processing:

```txt
npm run sync:worker:daemon
```

Run one daemon cycle and exit:

```txt
npm run sync:worker:once
```

Recommended when daemon is active:

```txt
SYNC_JOB_DISABLED=true
```

## Next Implementation Step

The next slice should focus on hardening and operator ergonomics:

- Add admin/debug UI for sync event search, replay, dead-letter handling, and conflict resolution.
- Add targeted sync hardening tests for replay/visibility-timeout/recovery and ownership routing.
- Add outbound processed-correlation metadata tracking to tighten loop prevention.
