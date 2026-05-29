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
SYNC_JOB_DISTRIBUTED_LOCK=true
SYNC_JOB_LOCK_KEY=sync:events:job-lock
SYNC_JOB_LOCK_TTL_SECONDS=120
SYNC_PROCESSING_STALE_AFTER_SECONDS=600
SYNC_PROCESSING_RECOVERY_LIMIT=100
SYNC_USE_REDIS_QUEUE=true
SYNC_QUEUE_KEY=sync:events:queue
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
- Marks webhook echoes from integration writes as ignored.
- Persists webhook events in `sync_event`.
- Upserts Medusa/Strapi mappings in `sync_mapping`.
- Records duplicate webhook events as deduplicated responses.
- Subscribes to Medusa product and product-category events and persists normalized Medusa-origin sync events.
- Runs scheduled job `sync-events-processor` every minute to process queued `sync_event` records.
- Supports configurable per-run worker concurrency via `SYNC_JOB_CONCURRENCY` (default `1`).
- Uses Redis-based distributed job lease lock to prevent overlapping sync-job runs across instances.
- Recovers stale `processing` events using lease-timeout settings and requeues them when retryable.
- Processes Medusa -> Strapi product sync writes using ownership mappers.
- Processes Medusa product-variant events by syncing parent products to Strapi.
- Processes Medusa product-category events by syncing category-linked products to Strapi.
- Processes Medusa inventory-item/inventory-level events by resolving linked variants/products and syncing affected products to Strapi.
- Processes Medusa price/price-set events by resolving linked variants/products and syncing affected products to Strapi.
- Processes Strapi -> Medusa product update writes using ownership mappers.
- Retries failed events until `SYNC_JOB_MAX_ATTEMPTS`; when max attempts is reached, marks event as dead-lettered in `error_message`.
- Adds secure operator endpoints to list failed events and replay failed/dead-lettered events.
- Adds secure operator endpoints for sync observability: recent events list and queue/status counts.
- Sends best-effort targeted cache invalidation webhook after successful product sync processing.
- Supports local mode without Strapi credentials using `SYNC_DISABLE_STRAPI_WRITES=true`.
- Enqueues new sync events into Redis and processes queue-first with DB polling fallback when queue is disabled.

## Next Implementation Step

The next slice should process and dispatch events:

- Add long-running Redis worker process with stronger per-message visibility-timeout guarantees.
- Expand ownership coverage for price-list and inventory reservation edge cases.
- Add admin/debug UI for sync event search, replay, and dead-letter requeue.
