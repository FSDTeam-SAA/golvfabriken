# Medusa/Strapi Sync Foundation

This folder contains the shared synchronization contract for the Medusa/Strapi integration.

## Current Endpoint

Strapi should call:

```txt
POST /integrations/strapi/webhooks
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
```

## Current Behavior

- Validates the Strapi webhook secret.
- Normalizes incoming Strapi webhook payloads into the FRD sync event shape.
- Generates deterministic event IDs when Strapi does not provide one.
- Generates correlation IDs when the request does not provide one.
- Calculates a payload checksum for idempotency.
- Marks webhook echoes from integration writes as ignored.
- Returns the normalized event with `202 Accepted`.

## Next Implementation Step

The next slice should persist normalized events and mappings:

- `sync_events`: event ID, correlation ID, source, entity, status, attempts, timestamps, error.
- `sync_mappings`: Medusa ID, Strapi document ID, locale, checksum, status, last source, last error.

After persistence exists, dispatch non-ignored events into a Redis-backed worker for ownership-rule mapping, target-system writes, cache invalidation, retries, and dead-letter handling.
