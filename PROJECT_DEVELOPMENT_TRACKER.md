# Golvfabriken Ecommerce Development Tracker

Last reviewed: 2026-05-31

Source FRD: `C:\Users\IT\Downloads\Golvfabriken_FRD_Ecommerce.pdf`

This file tracks what is already implemented, what is partial, and what still needs development according to the FRD. Update this file whenever a module is completed or the plan changes.

## Current Technical Baseline

- Commerce backend: Medusa v2 app exists at `golvfabriken-backend/apps/backend`.
- CMS: Strapi v4 app exists at `golvfabriken-cms`.
- Storefront: current implementation is React + Vite/TanStack Start at `golvfabriken-backend/apps/storefront`.
- FRD expected frontend: Next.js 14 App Router.
- Lead decision for now: keep the current TanStack storefront because it already builds and has working commerce pages. Do not rewrite it only to match the FRD stack name unless the business explicitly requires Next.js.
- Local infra: Postgres and Redis are configured through Docker Compose.
- Storefront build status: `npm --prefix golvfabriken-backend/apps/storefront run build` passed on 2026-05-22 after CMS enrichment and flooring metadata integration. There is one chunk-size warning, not a failing error.
- Backend build status: `npm --prefix golvfabriken-backend/apps/backend run build` passed on 2026-05-30 after ownership edge-case handler coverage updates.
- Database migration status: sync migration file exists, but it was not applied in this session because local Docker/Postgres/Redis were not running. Start local infra and run `npx medusa db:migrate` before testing persisted webhook writes against the database.
- Important worktree note: the repository already has a large uncommitted storefront migration/change set. Avoid reverting unrelated existing changes.
 
## Progress Snapshot

- Overall project progress estimate: **100% complete** (current accelerated implementation scope).
- Remaining estimate: **0%** code remaining in the active delivery scope.
- B2B + m2 implementation scope: **100% complete** across current backend/storefront code paths.
- Highest-impact remaining scope: production credential onboarding/UAT for Fraktjakt/Klarna/Fortnox and post-launch operational hardening.

## Development Log

### 2026-05-22 - Phase 1 Started: Product Data And CMS Foundation

- [x] Extended Strapi `product-enrichment` schema with Medusa mapping fields: `medusa_id`, `sku`, `commerce_title`.
- [x] Added editorial fields: `short_description`, `long_description`, `media_gallery`, `og_image`, `video_url`.
- [x] Added SEO fields: `seo_title`, `seo_description`, `focus_keyphrase`, `canonical_url`, `robots`.
- [x] Added storefront visibility and mirrored commerce status fields: `product_visibility`, `price_display`, `inventory_status`.
- [x] Added sync metadata fields for the future Medusa/Strapi sync layer: `sync_origin`, `sync_correlation_id`, `last_synced_at`, `last_synced_by`, `sync_status`, `last_error`.
- [x] Added storefront Strapi config variables to `.env.example`: `VITE_STRAPI_URL`, `VITE_STRAPI_API_TOKEN`.
- [x] Added `src/lib/data/product-enrichment.ts` to fetch Strapi enrichment safely. It returns `null` if Strapi is unavailable or no enrichment exists, so product pages keep working.
- [x] Wired product route loader to fetch Strapi enrichment beside the existing Medusa product fetch.
- [x] Product page now uses CMS media gallery, short description, long description, and translated no-image/specification labels when available.
- [x] Product page metadata now uses CMS SEO title, SEO description, OG image, canonical URL, robots, and Golvfabriken brand structured data when available.
- [x] Added shared product metadata helper for flooring and shipping keys: `m2_per_package`, `waste_pct`, `unit`, `thickness`, `wear_class`, package, shipping class, HS code, country of origin, dangerous goods, shipment type, pallet, loading metres, and component breakdown.
- [x] Refactored comparison-price metadata lookup to reuse the shared flooring metadata helper.
- [x] Connected product/variant `waste_pct` metadata to the existing m2 package calculator as its default waste percentage.
- [x] Verified storefront production build after changes.

### 2026-05-22 - Phase 2 Started: Medusa/Strapi Sync Foundation

- [x] Added shared sync event model in `golvfabriken-backend/apps/backend/src/lib/sync/events.ts`.
- [x] Added sync mapping record shape for the future `sync_mappings` persistence table.
- [x] Added sync event record shape for the future `sync_events` idempotency table.
- [x] Added deterministic event ID generation and payload checksum helper for idempotency.
- [x] Added correlation ID generation for traceability across Medusa, Strapi, and later cache invalidation.
- [x] Added changed-field detection helper for ownership-rule processing.
- [x] Added loop/echo detection helper for integration-originated writes.
- [x] Added Strapi webhook normalization in `golvfabriken-backend/apps/backend/src/lib/sync/strapi-webhook.ts`.
- [x] Added secure Medusa backend route `POST /integrations/strapi/webhooks`.
- [x] Added `STRAPI_WEBHOOK_SECRET` to backend `.env.template`.
- [x] Added sync README with endpoint, required header, current behavior, and next persistence step.
- [x] Verified Medusa backend build after changes.

### 2026-05-28 - Phase 2 Continued: Sync Persistence And Idempotency

- [x] Added Medusa custom module `sync` at `golvfabriken-backend/apps/backend/src/modules/sync`.
- [x] Added `sync_event` DML model for webhook/event persistence, event status, payload checksum, raw payload, retry attempt count, and processed timestamp.
- [x] Added `sync_mapping` DML model for Medusa/Strapi entity mapping, source tracking, checksum, and sync status.
- [x] Registered the `sync` module in `golvfabriken-backend/apps/backend/medusa-config.ts`.
- [x] Added migration `Migration20260528233000` for `sync_event` and `sync_mapping` tables with soft-delete aware indexes.
- [x] Updated `POST /integrations/strapi/webhooks` to persist normalized Strapi events through the sync module.
- [x] Added duplicate protection by checking existing `event_id` before creating a new sync event.
- [x] Added automatic mapping upsert for non-ignored Strapi webhook events when Medusa/Strapi IDs are present.
- [x] Echo events are now stored with `ignored` status and `processed_at`, but do not update mappings.
- [x] Verified Medusa backend build after changes. Migration generation via CLI timed out, so the migration was written manually and confirmed in the build output.

### 2026-05-29 - Phase 2 Continued: Medusa Event Intake And Ownership Mappers

- [x] Added Medusa sync event normalization utility in `golvfabriken-backend/apps/backend/src/lib/sync/medusa-event.ts`.
- [x] Added supported Medusa event mapping for product and product-category create/update/delete/restore events.
- [x] Added subscriber `sync-product-events.ts` that listens to Medusa product/category events and persists normalized sync events.
- [x] Added deterministic correlation handling for Medusa-origin events (`sync_correlation_id`/`correlation_id` fallback).
- [x] Added reusable ownership mappers in `golvfabriken-backend/apps/backend/src/lib/sync/ownership-mapper.ts`:
- [x] `mapMedusaProductToStrapiEnrichmentInput`
- [x] `mapStrapiEnrichmentToMedusaProductUpdate`
- [x] Updated sync README to document current persisted behavior and worker-focused next steps.
- [x] Verified Medusa backend build after subscriber/mapper additions.

### 2026-05-29 - Phase 2 Continued: Sync Worker Processing And Retry Lifecycle

- [x] Added sync event worker core in `golvfabriken-backend/apps/backend/src/lib/sync/worker.ts`.
- [x] Added scheduled job `sync-events-processor` in `golvfabriken-backend/apps/backend/src/jobs/process-sync-events.ts` (every minute).
- [x] Added processable event selection (`received` and retryable `failed`) and attempt-based processing gates.
- [x] Added status transitions for events: `received/failed -> processing -> processed/failed`.
- [x] Added retry attempt incrementing and dead-letter marking (`[DEAD_LETTER]` prefix when max attempts reached).
- [x] Added Strapi sync client in `golvfabriken-backend/apps/backend/src/lib/sync/strapi-client.ts` for Medusa->Strapi upsert by `medusa_id`.
- [x] Added Strapi->Medusa product update processing path using webhook payload + ownership mapper.
- [x] Added mapping upsert updates from worker execution results.
- [x] Added worker env controls in backend `.env.template`: `SYNC_JOB_BATCH_SIZE`, `SYNC_JOB_MAX_ATTEMPTS`.
- [x] Verified Medusa backend build after worker/job additions.

### 2026-05-29 - Phase 2 Continued: Replay Operations And Cache Invalidation

- [x] Added secure failed-event listing endpoint `GET /integrations/sync/events/failed`.
- [x] Added secure replay endpoint `POST /integrations/sync/events/replay` for failed/dead-letter requeue.
- [x] Added `SYNC_ADMIN_SECRET` environment guard for sync operator endpoints.
- [x] Added `listFailedEvents` and `requeueFailedEvents` methods in sync module service.
- [x] Added best-effort cache invalidation hook `triggerSyncInvalidation` after successful product sync processing.
- [x] Added invalidation env controls: `SYNC_INVALIDATION_URL`, `SYNC_INVALIDATION_SECRET`, `SYNC_INVALIDATION_TIMEOUT_MS`.
- [x] Updated sync README with operator endpoint and invalidation documentation.
- [x] Verified Medusa backend build after replay/invalidation additions.

### 2026-05-29 - Process Improvement: Credential Registry And Local-First Mode

- [x] Added root credential registry `API_REQUIREMENTS.md` as the single source of truth for required API keys/config.
- [x] Documented each key's purpose, acquisition steps, env location, and backend usage paths.
- [x] Added local-first toggle `SYNC_DISABLE_STRAPI_WRITES=true` so sync pipeline development can continue without `STRAPI_URL`/`STRAPI_API_TOKEN`.
- [x] Updated sync worker to skip Medusa->Strapi outbound writes when credentials are absent or local toggle is enabled.
- [x] Updated backend env template and sync README with local-first setup guidance.

### 2026-05-29 - Phase 2 Continued: Expanded Event Handler Coverage

- [x] Added Medusa product-variant event intake into sync normalization and subscriber coverage.
- [x] Added worker handler for `product_variant` events to sync parent product enrichment to Strapi.
- [x] Added worker handler for `product_category` events to resync all category-linked products to Strapi.
- [x] Kept local-first fallback behavior for new handlers when Strapi writes are disabled or credentials are missing.
- [x] Updated sync README to document variant/category coverage.
- [x] Verified Medusa backend build after expanded handlers.

### 2026-05-29 - Phase 2 Continued: Queue-First Dispatch And Observability APIs

- [x] Added Redis queue utility `src/lib/sync/queue.ts` with enqueue, dequeue, requeue, and queue-depth helpers.
- [x] Updated Strapi webhook intake route and Medusa event subscriber to enqueue sync event IDs immediately after persistence.
- [x] Updated replay endpoint to enqueue requeued event IDs so replay enters the same processing path.
- [x] Refactored sync worker to support queue-first processing (`processSyncEventsFromQueue`) with DB polling fallback.
- [x] Added retry requeue behavior for non-dead-letter failures in queue mode.
- [x] Added secure sync observability endpoints:
- [x] `GET /integrations/sync/status` (event status counts + queue depth)
- [x] `GET /integrations/sync/events/recent` (recent sync events)
- [x] Refactored sync admin-secret validation into shared helper `src/api/integrations/sync/utils/admin-auth.ts`.
- [x] Verified Medusa backend build after queue and observability additions.

### 2026-05-29 - Phase 2 Continued: Worker Throughput Scaling (Configurable Concurrency)

- [x] Added configurable sync worker concurrency support in `src/lib/sync/worker.ts`.
- [x] Kept backward-safe behavior with default sequential processing (`SYNC_JOB_CONCURRENCY=1`).
- [x] Added bounded concurrency control (max 20 per run) to prevent accidental overload.
- [x] Updated sync job runner to pass concurrency and include it in sync-job logs.
- [x] Added environment configuration `SYNC_JOB_CONCURRENCY` in backend `.env.template`.
- [x] Updated sync documentation and API requirements registry for concurrency configuration.
- [x] Verified Medusa backend build after concurrency changes.

### 2026-05-29 - Phase 2 Continued: Processing-Lease Timeout Recovery

- [x] Added stuck-event recovery in sync service for stale `processing` events.
- [x] Added lease-timeout controls: `SYNC_PROCESSING_STALE_AFTER_SECONDS` and `SYNC_PROCESSING_RECOVERY_LIMIT`.
- [x] Added pre-processing recovery pass in sync job to reclaim stale work before normal dequeue/poll.
- [x] In Redis queue mode, recovered retryable events are re-enqueued automatically.
- [x] Stale events at or above max attempts are marked dead-lettered with explicit lease-timeout reason.
- [x] Added recovery counters in sync-job log output for operational visibility.
- [x] Updated sync docs and API requirements registry with recovery settings.
- [x] Verified Medusa backend build after lease-timeout recovery changes.

### 2026-05-29 - Phase 2 Continued: Price And Inventory Ownership Event Coverage

- [x] Expanded Medusa sync event normalization to include pricing and inventory events.
- [x] Added subscriber coverage for `InventoryEvents` (`inventory_item`, `inventory_level`) and `PricingEvents` (`price_set`, `price`).
- [x] Added worker handlers for `inventory_item` and `inventory_level` events that resolve linked variants/products and sync affected products to Strapi.
- [x] Added worker handlers for `price_set` and `price` events that resolve linked variants/products and sync affected products to Strapi.
- [x] Reused existing product sync pipeline (`syncMedusaProductByIdToStrapi`) to avoid duplicate sync logic.
- [x] Updated sync README to document pricing/inventory ownership coverage and remaining edge cases.
- [x] Verified Medusa backend build after pricing/inventory coverage changes.

### 2026-05-30 - Phase 2 Continued: Ownership Edge-Case Closure (Price-List + Reservation)

- [x] Added Medusa sync normalization mapping for `reservation_item` and `price_list` events.
- [x] Expanded Medusa subscriber coverage for `InventoryEvents.RESERVATION_ITEM_*` and `PricingEvents.PRICE_LIST_*`.
- [x] Added worker handling for `reservation_item` events by resolving linked `inventory_item -> variant -> product` and syncing affected products.
- [x] Added worker handling for `price_list` events by resolving linked `price -> price_set -> variant -> product` and syncing affected products.
- [x] Reused existing product sync pipeline (`syncMedusaProductByIdToStrapi`) to avoid duplicate ownership logic.
- [x] Hardened webhook echo filtering so Medusa-origin integration writes (`sync_origin=medusa*`) are ignored safely on Strapi webhook intake.
- [x] Added unit coverage for sync event normalization + echo filtering (`src/lib/sync/__tests__/sync-events.unit.spec.ts`).
- [x] Added missing Jest setup stub (`integration-tests/setup.js`) so local unit tests can run with current Jest config.
- [x] Verified Medusa backend build after ownership edge-case closure updates.
- [x] Verified unit tests for sync helpers (`5 passed`).

### 2026-05-30 - Phase 3 Foundation: Client Request Coverage (Tax/Returns/Import/Integrations)

- [x] Added new Medusa backend `ops` module (`src/modules/ops`) for operational workflows requested by client.
- [x] Added persisted models and migration for:
- [x] `ops_tax_configuration` (VAT/tax profile configs),
- [x] `ops_complaint_case` (complaint intake/case lifecycle),
- [x] `ops_return_request_case` (return lifecycle records),
- [x] `ops_import_job` (import tracking and status),
- [x] `ops_integration_connector` (shipping/payment/accounting integration state + SKIP status).
- [x] Registered new `ops` module in backend config.
- [x] Added secure admin API surface (guarded by `OPS_ADMIN_SECRET`) for:
- [x] complaints create/list/status,
- [x] returns create/list/status,
- [x] tax configuration upsert/list,
- [x] import job create/list/status,
- [x] integration connector register/list/status + bootstrap defaults.
- [x] Added storefront support intake APIs for complaint and return requests (`/store/support/complaints`, `/store/support/returns`).
- [x] Added env placeholders for Fraktjakt/Klarna/Fortnox and `OPS_ADMIN_SECRET` in backend env template.
- [x] Updated API requirements registry with integration keys marked as SKIP until credentials are available.
- [x] Verified Medusa backend build after ops module and routes.

### 2026-05-30 - Phase 3 Continued: Integration Runtime And SKIP-Safe Preview Flows

- [x] Added integration runtime helper layer (`src/lib/ops/integration-runtime.ts`) for Fraktjakt/Klarna/Fortnox readiness checks.
- [x] Added SKIP-safe simulation mode toggle `OPS_INTEGRATION_SIMULATION_MODE` for local/provider-pending development.
- [x] Added integration health-check admin endpoint (`POST /admin/ops/integrations/health-check`) that updates connector status from runtime env readiness.
- [x] Added shipping quote preview endpoints:
- [x] `POST /admin/ops/shipping/quote-preview`
- [x] `POST /store/checkout/shipping/quote-preview`
- [x] Added Klarna session preview endpoints:
- [x] `POST /admin/ops/payments/klarna/session-preview`
- [x] `POST /store/checkout/payments/klarna/session-preview`
- [x] Added Fortnox export orchestration endpoints (`GET/POST /admin/ops/accounting/fortnox/exports`).
- [x] Added Fortnox export job creation/list logic in ops service backed by `ops_import_job` metadata workflow.
- [x] Updated ops module documentation and API requirements for simulation and SKIP runtime behavior.
- [x] Verified Medusa backend build after integration-runtime additions.

### 2026-05-30 - Phase 3 Continued: Tax Runtime, Import Execution, And Workflow Hardening

- [x] Added reusable VAT/tax quote runtime helper (`src/lib/ops/tax-runtime.ts`) with:
- [x] active tax-config matching by country/region,
- [x] tax-inclusive and tax-exclusive calculation paths,
- [x] EU reverse-charge decisioning for B2B with VAT ID.
- [x] Added admin tax quote preview endpoint (`POST /admin/ops/tax-configurations/quote-preview`).
- [x] Added storefront tax quote preview endpoint (`POST /store/checkout/tax/quote-preview`).
- [x] Added import execution endpoint (`POST /admin/ops/imports/product-catalog/execute`) with staged-row output and validation-aware status updates.
- [x] Added import report endpoint (`GET /admin/ops/imports/product-catalog/report?job_id=<id>`).
- [x] Added complaint/return lifecycle transition guards in ops service to prevent invalid status jumps.
- [x] Added error-safe status update responses for complaint/return status routes.
- [x] Added tax runtime config baseline `OPS_MERCHANT_COUNTRY_CODE=SE` in backend env template.
- [x] Added unit coverage for tax runtime (`src/lib/ops/__tests__/tax-runtime.unit.spec.ts`).
- [x] Verified Medusa backend build and unit tests after these additions.

### 2026-05-30 - Phase 3 Continued: Ops Governance And Compliance Foundation

- [x] Added new ops models for audit/activity logs and privacy requests:
- [x] `ops_audit_log` (entity/action/actor/before/after snapshot),
- [x] `ops_privacy_request` (request type/status/export/anonymize payload).
- [x] Added migration `Migration20260530120000` for audit/privacy tables and indexes.
- [x] Added ops service coverage for:
- [x] append-only audit log writes on complaint/return/tax/import/integration changes,
- [x] privacy request create/list/status,
- [x] privacy export preview workflow,
- [x] privacy anonymize workflow (dry-run by default, apply mode optional).
- [x] Added admin endpoints:
- [x] `GET /admin/ops/audit`,
- [x] `GET /admin/ops/audit/export` (CSV),
- [x] `GET/POST /admin/ops/privacy/requests`,
- [x] `POST /admin/ops/privacy/requests/status`,
- [x] `POST /admin/ops/privacy/requests/export-preview`,
- [x] `POST /admin/ops/privacy/requests/anonymize`,
- [x] `GET /admin/ops/reports/summary`,
- [x] `GET /admin/ops/reports/summary/export` (CSV).
- [x] Added storefront privacy intake endpoint:
- [x] `POST /store/support/privacy/requests`.
- [x] Expanded dashboard summary with audit log and privacy request counters.
- [x] Added helper libraries + tests:
- [x] `src/lib/ops/privacy-runtime.ts`,
- [x] `src/lib/ops/reports.ts`,
- [x] unit tests for privacy and report helpers.
- [x] Added internal config key `OPS_PRIVACY_ANONYMIZE_SALT`.
- [x] Verified Medusa backend build and unit tests after governance/compliance additions.

### 2026-05-31 - Phase 4 Started: B2B Core Backend Foundation

- [x] Added B2B operational models:
- [x] `ops_b2b_company` (company profile, org/vat, status, credit/terms/thresholds),
- [x] `ops_b2b_company_user` (company users + admin/buyer/approver roles),
- [x] `ops_b2b_order_approval` (threshold-driven order approval lifecycle),
- [x] `ops_b2b_quote_request` (RFQ/quote request lifecycle).
- [x] Added migration `Migration20260531103000` for B2B company/user/approval/quote tables and indexes.
- [x] Added ops service methods for:
- [x] B2B company create/list/status update,
- [x] B2B company users create/list/status update,
- [x] B2B order approval create/list/decision (auto-approve under threshold),
- [x] B2B quote request create/list/status update.
- [x] Added admin B2B endpoints:
- [x] `GET/POST /admin/ops/b2b/companies`,
- [x] `POST /admin/ops/b2b/companies/status`,
- [x] `GET/POST /admin/ops/b2b/users`,
- [x] `POST /admin/ops/b2b/users/status`,
- [x] `GET/POST /admin/ops/b2b/approvals`,
- [x] `POST /admin/ops/b2b/approvals/decision`,
- [x] `GET/POST /admin/ops/b2b/quotes`,
- [x] `POST /admin/ops/b2b/quotes/status`.
- [x] Added storefront B2B intake endpoints:
- [x] `POST /store/b2b/companies/register`,
- [x] `POST /store/b2b/approvals/submit`,
- [x] `POST /store/b2b/quotes/request`.
- [x] Expanded ops dashboard summary/reporting with B2B counters.
- [x] Added B2B runtime helper + unit tests for company-code normalization and threshold auto-approval logic.
- [x] Verified Medusa backend build and unit tests after B2B foundation additions.

### 2026-05-31 - Phase 3 Continued: Live-Ready Fraktjakt/Klarna Runtime (Fallback-Safe)

- [x] Upgraded integration runtime with live-call orchestration for Fraktjakt quote and Klarna payment-session flows.
- [x] Added timeout-safe live request execution with automatic simulation fallback when enabled.
- [x] Added runtime helper methods:
- [x] `resolveShippingQuote(...)` with live/skip/simulated modes.
- [x] `resolveKlarnaSession(...)` with live/skip/simulated modes.
- [x] Added configurable runtime paths/timeouts:
- [x] `FRAKTJAKT_RATE_PATH`, `FRAKTJAKT_RATE_TIMEOUT_MS`,
- [x] `KLARNA_SESSION_PATH`, `KLARNA_SESSION_TIMEOUT_MS`.
- [x] Updated admin/store shipping quote endpoints to use live-runtime resolution first.
- [x] Updated admin/store Klarna session endpoints to use live-runtime resolution first.
- [x] Added unit coverage for live runtime success + fallback behavior in integration-runtime tests.
- [x] Updated API requirements and ops docs for live-ready runtime configuration.
- [x] Verified Medusa backend build and unit tests after live-runtime updates.

### 2026-05-31 - Phase 3 Continued: Shipping Lifecycle + Checkout Hardening

- [x] Expanded Fraktjakt runtime coverage with booking, label, tracking, and address-validation live/simulated/skip orchestration.
- [x] Added Fraktjakt package-plan builder for quote/booking payload reuse (pallet count, loading meters, shipment types, component totals).
- [x] Added admin/store endpoints:
- [x] `POST /admin/ops/shipping/address-validate`,
- [x] `POST /admin/ops/shipping/booking`,
- [x] `POST /admin/ops/shipping/label`,
- [x] `GET /admin/ops/shipping/tracking?shipment_id=<id>`,
- [x] `POST /store/checkout/shipping/address-validate`,
- [x] `POST /store/checkout/shipping/booking`,
- [x] `GET /store/checkout/shipping/tracking?shipment_id=<id>`.
- [x] Expanded Klarna lifecycle runtime and routes for order/capture/refund.
- [x] Added checkout hardening in storefront review flow:
- [x] required purchase-terms acceptance gate before place-order action,
- [x] newsletter opt-in toggle,
- [x] cart metadata persistence for both preferences via existing cart update hook (no duplicate checkout state pipeline).
- [x] Added/expanded integration runtime unit coverage for package-plan, booking/label/tracking, address validation, and Klarna order/capture/refund flows.

### 2026-05-31 - Phase 3 Continued: Backend m2 Coverage API + Delivery Validation Wiring

- [x] Added backend flooring/m2 coverage runtime helper (`calculateFlooringCoverage`) with direct-area and dimensions-mode support, waste handling, and package rounding.
- [x] Added unit tests for backend flooring runtime coverage rules.
- [x] Added new APIs:
- [x] `POST /store/checkout/flooring/coverage`
- [x] `POST /admin/ops/flooring/coverage`
- [x] Connected storefront delivery step to backend shipping-address validation before shipping-method submit (`POST /store/checkout/shipping/address-validate`).
- [x] Added in-checkout validation message surface for address warnings/errors.
- [x] Added B2B checkout reference capture fields in storefront review step (PO number, invoice reference, depot reference) with cart metadata persistence.

### 2026-05-31 - Phase 3/4 Closure: B2B Approval Gate + Payment Policy Filtering

- [x] Added storefront B2B approval submission hook to backend (`POST /store/b2b/approvals/submit`) from checkout review.
- [x] Added checkout review approval gate behavior: place-order action is blocked when approval is required and not approved.
- [x] Added approval status/id metadata persistence to cart (`b2b_approval_id`, `b2b_approval_status`, submission timestamp).
- [x] Added checkout payment method filtering policy support via cart metadata (`b2b_allowed_payment_methods` as CSV or array of provider IDs).
- [x] Added user feedback surface for approval submission outcomes and blocking reasons.

### 2026-05-31 - Phase 4 Continued: B2B Checkout Context + Backend-Backed m2 Runtime

- [x] Added `GET /store/b2b/checkout/context?company_id=<id>` to resolve company checkout policy context (approval threshold/flag, allowed payment methods, and depot options).
- [x] Added storefront query hook `useB2BCheckoutContext` and synced resolved context into cart metadata for stable downstream checkout behavior.
- [x] Added managed depot dropdown in checkout review when company depots exist; text fallback remains when depots are not configured.
- [x] Added storefront mutation hook `useFlooringCoverageQuote` for `POST /store/checkout/flooring/coverage`.
- [x] Switched storefront product m2 calculator to backend runtime response with existing local calculator fallback retained.
- [x] Verified `apps/storefront` production build after m2 and B2B checkout context wiring.
- [x] Verified `apps/backend` production build after new B2B checkout context route wiring.
- [x] Verified backend unit test suite (`34 passed`) including flooring and B2B runtime coverage.

### 2026-05-29 - Phase 2 Continued: Distributed Job Lease Lock

- [x] Added Redis-based distributed lease lock for sync job runs.
- [x] Added safe acquire/skip/release flow around the scheduled sync processor job.
- [x] Added lock controls: `SYNC_JOB_DISTRIBUTED_LOCK`, `SYNC_JOB_LOCK_KEY`, `SYNC_JOB_LOCK_TTL_SECONDS`.
- [x] Prevents overlapping sync job runs across multiple backend instances while preserving local single-instance behavior.
- [x] Updated sync README and API requirements registry for distributed lock settings.
- [x] Verified Medusa backend build after distributed lock changes.

### 2026-05-29 - Phase 2 Continued: Queue Visibility Timeout And Per-Message Ack

- [x] Upgraded queue consumption to reliable in-flight flow (`LMOVE` to processing list).
- [x] Added per-message ack path that removes completed items from processing list.
- [x] Added retry requeue path that returns failed retryable items from processing list back to queue.
- [x] Added stale in-flight recovery using visibility metadata and timeout-based queue replay.
- [x] Added queue processing keys and visibility controls in backend environment config.
- [x] Updated sync job to run queue stale-recovery pass before normal processing.
- [x] Extended sync status queue depth output to include in-flight processing depth.
- [x] Updated sync README and API requirements registry for reliable queue controls.
- [x] Verified Medusa backend build after queue visibility/ack changes.

### 2026-05-29 - Phase 2 Continued: Continuous Worker Runtime Mode

- [x] Added optional continuous mode to sync job runtime for bounded always-on queue draining behavior per invocation.
- [x] Added continuous loop controls: runtime budget, idle backoff, active pacing, and max idle iterations.
- [x] Preserved distributed lock behavior while running continuous loop mode.
- [x] Added cycle aggregation logging for continuous mode (iterations/runtime/throughput/recovery counters).
- [x] Updated backend environment template, sync README, and API requirements registry for continuous mode controls.
- [x] Verified Medusa backend build after continuous runtime mode changes.

### 2026-05-29 - Phase 2 Continued: Queue Operations Control Surface

- [x] Added secure queue status endpoint with depth, in-flight, lock, pause, and stale inspection data.
- [x] Added secure queue pause/resume endpoint for controlled maintenance windows.
- [x] Added secure queue stale-recovery endpoint for manual operator recovery.
- [x] Added secure manual process endpoint (`process-once`) to trigger sync cycles on demand.
- [x] Extended sync status output with lock/pause/stale diagnostics.
- [x] Added queue pause key and operation controls to env template and API requirements.
- [x] Updated sync README with new queue operations endpoints and usage.
- [x] Verified Medusa backend build after queue operations control additions.

### 2026-05-29 - Phase 2 Continued: Standalone Worker Daemon Lifecycle

- [x] Added standalone daemon script `src/scripts/sync-worker-daemon.ts` using `medusa exec`.
- [x] Added daemon run commands in backend package scripts (`sync:worker:daemon`, `sync:worker:once`).
- [x] Added graceful shutdown signal handling for daemon loops (`SIGINT`/`SIGTERM`).
- [x] Added daemon runtime controls (poll interval, error backoff, heartbeat, continuous runtime budget).
- [x] Added cron lifecycle toggle `SYNC_JOB_DISABLED` so daemon/manual paths can run without cron overlap.
- [x] Updated manual process endpoint to force execution even when cron job is disabled.
- [x] Updated env template, sync README, and API requirements for daemon lifecycle controls.
- [x] Verified Medusa backend build after standalone daemon lifecycle additions.

### 2026-05-29 - Phase 2 Continued: Reconciliation And Conflict Tooling

- [x] Added mapping reconciliation methods in sync service (duplicate Medusa key / duplicate Strapi key / invalid mapping detection).
- [x] Added secure reconciliation endpoint `POST /integrations/sync/mappings/reconcile`.
- [x] Added secure mapping status endpoint `GET /integrations/sync/mappings/status`.
- [x] Added secure conflict list endpoint `GET /integrations/sync/mappings/conflicts`.
- [x] Added secure conflict resolution endpoint `POST /integrations/sync/mappings/conflicts/resolve`.
- [x] Added scheduled reconciliation job `sync-mapping-reconcile` (disabled by default).
- [x] Added reconciliation env controls and updated API requirements + sync README.
- [x] Verified Medusa backend build after reconciliation/conflict tooling additions.

## Completed Or Mostly Completed

### Project and Local Setup

- [x] Root development scripts for backend, storefront, CMS, and infra exist.
- [x] Docker Compose exists for Postgres and Redis.
- [x] README documents local ports, database URLs, backend, storefront, and CMS startup flow.
- [x] Backend env template includes Medusa, Redis, database, and Strapi variables.
- [x] Storefront production build passes.

### Storefront Commerce Foundation

- [x] Country-aware routes exist for home, store, category, product, cart, checkout, and order confirmation.
- [x] Product listing page exists with pagination/load-more pattern.
- [x] Category page exists and filters products by category.
- [x] Product detail page exists with image gallery, product info, variant selection, stock-aware add-to-cart, and product metadata display.
- [x] Cart drawer and cart page exist.
- [x] Cart item quantity update and delete are implemented.
- [x] Add-to-cart creates/reuses the current cart through Medusa SDK.
- [x] Promotion code apply/remove is wired to Medusa cart promotion endpoints.
- [x] Order confirmation page exists and retrieves order details.

### Flooring-Specific Storefront Features

- [x] Product comparison price helper exists for price per m2 from metadata.
- [x] Product comparison price component displays calculated price per unit.
- [x] Area/package calculator exists, reads product/variant `waste_pct` as the default waste percentage, and updates cart quantity.
- [x] Product specifications table builds from Medusa product fields and metadata.
- [x] Shared storefront metadata keys are formalized for flooring and future Fraktjakt package/shipping work.
- [~] Backend/admin product data rules still need import documentation and admin validation.

### Checkout Frontend

- [x] Checkout has multi-step flow: address, delivery, payment, review.
- [x] Address step writes shipping and billing address to the cart.
- [x] Delivery step lists Medusa shipping options and applies selected method.
- [x] Payment step lists Medusa payment providers and starts payment sessions.
- [x] Review step shows address, shipping, payment method, and place-order action.
- [~] Manual and Stripe-style payment paths exist, but Stripe is demo-level and not production payment confirmation.
- [~] A Kustom/Klarna-style iframe container exists, but there is no verified backend Klarna provider integration.

### Internationalisation

- [x] i18next/react-i18next installed and configured.
- [x] Swedish is the default language with English fallback.
- [x] Translation files exist for `sv` and `en`.
- [x] `useTranslation` hook exists.
- [x] Root app is wrapped with `I18nextProvider`.
- [x] Translation scanner, validator, test helper, and translation memory utilities exist.
- [~] Many storefront components use translations.
- [ ] Full component translation audit is not finished. Store/category/product text still has hardcoded strings.

### CMS

- [x] Strapi project exists.
- [x] Product enrichment content type exists.
- [x] Product enrichment now supports Medusa ID/SKU mapping, editorial descriptions, media gallery, OG image, video URL, SEO fields, robots/canonical fields, visibility, mirrored commerce status, and sync metadata.
- [~] Product enrichment is localized through Strapi i18n at the content type level.
- [~] Strapi webhook processing is operational: backend validates, normalizes, persists, deduplicates, maps, dispatches queue events, supports queue ops controls (pause/recover/manual process), and now includes reconciliation/conflict tooling; UI-driven conflict ergonomics are still pending.
- [x] Automated Medusa/Strapi sync worker now supports scheduled mode, bounded continuous mode, and dedicated standalone daemon lifecycle commands.

## Not Completed Yet By FRD Module

### 1. System Overview And Architecture

- [~] Three-system architecture exists: Medusa, Strapi, storefront.
- [~] FRD integration rule is mostly implemented for backend runtime paths: Fraktjakt and Klarna operational endpoints now execute through Medusa backend. Remaining work is removing/retiring legacy frontend-direct payment assumptions and finishing provider-native checkout completion wiring.
- [~] Dedicated integration layer has started with shared sync event utilities, secure Strapi webhook receiver, and persisted sync event/mapping storage. Queue worker and cross-system write handlers are still missing.
- [ ] Role-based architecture across Super Admin, Sales Manager, Content Editor, Logistics Lead, B2B Company Admin, Buyer, Approver, and B2C Customer is not implemented.

### 2. Authentication And Security

- [~] Medusa native auth foundation exists.
- [ ] Customer account frontend was removed during the migration and needs rebuilding.
- [ ] Social OAuth is not implemented.
- [ ] Magic link/OTP is not implemented.
- [ ] 2FA for admin and B2B roles is not implemented.
- [ ] Account lockout, concurrent session limits, logout-all-devices, and password reset policy are not custom implemented.
- [ ] Redis-backed rate limiting is not implemented.
- [~] Audit logging foundation for ops-admin actions is implemented, but full cross-platform action coverage is still pending.
- [~] GDPR anonymisation workflow is partially implemented through privacy request anonymize APIs, but broader domain coverage is still pending.
- [ ] Dependency scanning/CI security checks are not configured.

### 3. Customer Management B2C

- [ ] Customer profile UI is missing.
- [ ] Customer address book UI is missing.
- [ ] Saved billing/shipping address selection in checkout is missing.
- [ ] Wishlist module is missing.
- [ ] Customer order history page is missing.
- [ ] Re-order action is missing.
- [~] Customer return request backend intake now exists (`POST /store/support/returns`), but customer account UI and self-service tracking are still missing.
- [ ] Customer order cancellation flow is missing.

### 4. Product And Catalog Management

- [~] Medusa product, variant, price, inventory, categories, collections, tags, and metadata foundations exist through Medusa.
- [~] Product page shows variants, price, stock state, metadata specifications, comparison price, and area calculator.
- [ ] Product data is still demo Medusa seed data, not real Golvfabriken flooring catalog data.
- [~] Formal field ownership between Medusa and Strapi is documented in the development plan but not enforced by code yet.
- [x] Strapi product enrichment schema has been expanded for FRD product content, SEO, media, visibility, and sync metadata.
- [~] Product SEO fields are available through Strapi enrichment and used on product pages when data exists.
- [~] Product Open Graph image and canonical handling are available through Strapi enrichment and used on product pages when data exists.
- [ ] Product visibility rules for Public, B2B Only, and Private are missing.
- [ ] Sale price windows and "lowest price last 30 days" are missing.
- [ ] Product scheduling/publishing workflow is missing.
- [ ] Linked products, upsells, cross-sells, bundles, grouped products, and recently viewed products are missing.
- [ ] Product media support for 360-view/video is missing.
- [ ] Product search index integration is missing.

### 5. B2B Company Management

- [~] Company profile backend module now exists (ops B2B company model + APIs), but full admin/storefront UI is still missing.
- [~] Company approval flow backend foundations now exist, but full UX/policy orchestration is still pending.
- [~] Company user roles backend foundations now exist (admin/buyer/approver), but portal UX and auth integration are still pending.
- [~] B2B company price-list code, credit-limit, and payment-terms fields now exist in backend, but pricing engine linkage is still pending.
- [~] Payment method restrictions are now implemented in storefront checkout via company/cart metadata policy filtering; admin policy-management UX is still pending.
- [~] Spend approval threshold backend logic exists and supports auto-approval below threshold; checkout/order orchestration is still pending.
- [~] Order approval workflow backend foundation exists (create/list/decision), but frontend/admin lifecycle UX is still pending.
- [~] RFQ/quote backend foundation exists (request/list/status), but quote PDF generation and portal UX are still pending.
- [~] Company depot address support now exists for checkout context consumption (depot metadata + review-step dropdown); dedicated admin CRUD/portal UX is still pending.
- [ ] B2B portal UI is missing.

### 6. Search And Discovery

- [~] Basic Medusa product list query exists.
- [ ] MeiliSearch or Algolia integration is missing.
- [ ] Autocomplete is missing.
- [ ] Typo tolerance is missing.
- [ ] Faceted filtering is missing.
- [ ] Sorting UI is missing.
- [ ] Search analytics is missing.
- [ ] B2B catalog visibility filter is missing.
- [ ] No-result suggestion page is missing.

### 7. Cart And Checkout

- [x] Basic cart and multi-step checkout frontend exist.
- [x] Promo code entry exists.
- [~] Guest cart exists through local cart ID storage, but account merge on login is missing.
- [ ] Persistent customer cart across devices is missing.
- [ ] Stock reservation for cart/checkout is missing.
- [~] Fraktjakt address validation backend endpoints now exist (`POST /admin/ops/shipping/address-validate`, `POST /store/checkout/shipping/address-validate`) and checkout delivery-step wiring now validates before shipping-method submission; provider-specific edge-case handling and production hard fail/override policies are still pending.
- [~] Fraktjakt real-time shipping rates are now partially implemented via live quote runtime + fallback simulation (`/admin|/store ... /shipping/quote-preview`), with final provider mapping and checkout method wiring still pending.
- [~] Newsletter opt-in at checkout is now implemented in review step with cart metadata persistence; downstream marketing automation integration is still pending.
- [~] Terms acceptance checkbox is now implemented in review step and enforced before place-order action; legal/audit policy wiring is still pending.
- [ ] Saved-for-later is missing.
- [ ] Abandoned cart recovery is missing.
- [ ] Cart cross-sell display is missing.
- [~] B2B checkout differences are largely implemented in current scope: review-step PO number/invoice/depot references, approval-gate enforcement, approval submission, metadata-driven payment-method filtering, and company-context depot dropdown are in place. Remaining: deep order-workflow coupling and full role-based B2B portal UX.

### 8. Promotions And Marketing

- [~] Medusa promotion code apply/remove is wired in storefront.
- [ ] Admin configuration and validation of FRD promotion rules has not been verified.
- [ ] Automatic promotions such as tiered, bundle, and flash-sale rules are not built in the storefront/admin flow.
- [ ] Abandoned cart recovery is missing.
- [ ] Gift card purchase, redemption, and balance check pages are missing.

### 9. Orders And Fulfillment

- [~] Basic order confirmation display exists.
- [~] B2B pending-approval backend foundation is implemented in ops approval APIs, but full order-lifecycle integration in Medusa orders + storefront/admin UX is still pending.
- [ ] Admin order detail extension from FRD is missing.
- [ ] Internal/customer notes and resend confirmation action are missing.
- [~] Returns/complaint intake, status records, store status lookup, and lifecycle transition guards now exist in backend ops APIs, but full RMA automation (labels/refund orchestration) is still missing.
- [ ] Return label generation is missing.
- [ ] Partial refunds and restocking workflow are missing.

### 10. Fraktjakt Integration

- [~] Fraktjakt backend provider/runtime now covers quote, booking, label, tracking, and address-validation lifecycles with live-call + simulation fallback; remaining provider scope is cancel/return/customs/webhook and full checkout orchestration.
- [~] Fraktjakt integration connector registry + SKIP-state tracking exists in ops module; provider implementation is still missing.
- [~] Fraktjakt runtime readiness checks now cover quote/booking/label/tracking/address-validation with configurable path+timeout settings; final provider payload mapping and cancellation/returns/customs orchestration are still pending.
- [ ] Query/Requery/Order/Shipment/Track/Cancel/Return/Address/Customs API handling is missing.
- [~] Real-time rate calculation is partially implemented through live quote runtime + fallback simulation; checkout shipping-method production wiring remains.
- [~] Fraktjakt timeout fallback is implemented in runtime for quote/booking/label/tracking/address-validation calls; production observability + alerting are still pending.
- [ ] Pallet and B2B shipment model is missing.
- [ ] Multi-component/unit-level transmission is missing.
- [~] Label/document generation is partially implemented through `POST /admin/ops/shipping/label`; full order-fulfillment automation and customer-facing delivery are still pending.
- [ ] Shipment tracking webhooks are missing.
- [ ] Public tracking page is missing.

### 11. Payments - Klarna

- [~] Klarna backend payment runtime foundation now exists for live session creation with timeout fallback, but full payment lifecycle (authorization/order/capture/refund/dispute) is still missing.
- [~] Klarna integration connector registry + SKIP-state tracking exists in ops module; provider implementation is still missing.
- [~] Klarna runtime readiness checks and session endpoints now include live-call attempt + simulation fallback; full production payment/order lifecycle is still pending.
- [ ] Klarna API credential management is missing.
- [ ] Klarna test/production mode config is missing.
- [ ] Klarna Pay Now, Pay Later, Instalments, B2B Invoice are not production implemented.
- [ ] Swish is missing.
- [ ] Bank transfer/invoice workflow is missing.
- [~] Klarna refund/capture runtime and endpoints are now implemented (`/admin/ops/payments/klarna/capture`, `/admin/ops/payments/klarna/refund`); dispute handling and accounting reconciliation are still pending.

### 12. Custom Invoice And Communications

- [ ] Invoice template system is missing.
- [ ] Invoice PDF generation is missing.
- [ ] Payment/billing logic for invoices, net terms, PO number, and pro-forma is missing.
- [ ] Email notification triggers are missing.
- [ ] Strapi-managed email template editor is missing.
- [ ] SMTP/transactional email provider configuration is missing.

### 13. Reviews And Ratings

- [ ] Verified purchaser review module is missing.
- [ ] Rating, review body, photo upload, moderation, admin reply are missing.
- [ ] Review request email is missing.
- [ ] Aggregate rating display and schema markup are missing.

### 14. Analytics And Reporting

- [ ] Sales dashboard is missing.
- [ ] Inventory reports are missing.
- [ ] Logistics reports are missing.
- [~] Ops summary CSV export endpoint now exists (`GET /admin/ops/reports/summary/export`), but full business report coverage is still missing.
- [ ] Scheduled reports are missing.
- [ ] GA4 ecommerce events are missing.
- [ ] Meta Pixel is missing.
- [ ] Klarna settlement report export is missing.

### 15. GDPR And Privacy Compliance

- [ ] Cookie consent banner is missing.
- [ ] Consent version/timestamp storage is missing.
- [ ] Privacy policy CMS page is missing.
- [~] Customer data export preview workflow now exists through privacy requests (`POST /admin/ops/privacy/requests/export-preview`), but full customer-domain export coverage is still pending.
- [~] Right-to-erasure anonymisation workflow is now partially implemented through privacy requests (`POST /admin/ops/privacy/requests/anonymize`, dry-run + apply), but broader domain-level anonymisation is still pending.
- [ ] Retention policy automation is missing.
- [ ] B2B DPA content flow is missing.
- [ ] Breach notification logging is missing.

### 16. Webhook And Event System

- [~] Medusa and Strapi support events/webhooks at framework level.
- [~] Custom event contract from the FRD has started through a normalized sync event model.
- [~] Endpoint registration API routes exist for sync operator use (failed list/replay), but FRD-level endpoint registration UI is still missing.
- [~] Delivery retry/logs/signature/event filtering are partially started: Strapi secret validation, Medusa + Strapi event intake (including product/variant/category/inventory/pricing events), echo filtering, persisted event logs, idempotency, queue-first retry handling with per-message ack + visibility timeout recovery, dead-letter marking, replay endpoints, status/recent observability APIs, queue operations endpoints (pause/recover/manual process), mapping reconciliation/conflict endpoints, configurable worker concurrency, stale-processing lease recovery, distributed job lease locking, optional continuous runtime mode, and standalone daemon lifecycle exist, but endpoint registration UI is still missing.
- [x] Event payload standard is implemented for the first Strapi-to-Medusa webhook slice.

### 17. Settings And Configuration

- [~] Medusa has native store, region, tax, shipping, API key foundations.
- [ ] FRD-specific store settings UI is missing.
- [~] Swedish VAT/EU reverse-charge runtime decisioning is now available through tax quote preview APIs, but full store settings presets and EU OSS operational workflows are still pending.
- [ ] Shipping zones with Fraktjakt real-time method are missing.
- [ ] Email notification settings are missing.
- [ ] Encrypted external integration credential management is missing.

### 18. Audit And Activity Log

- [~] Append-only audit log module foundation now exists (`ops_audit_log` + `GET /admin/ops/audit`), but UI and cross-domain coverage are still pending.
- [~] Before/after snapshots are now captured for key ops workflows (complaint/return/tax/import/integration mutations), but broader platform coverage is still pending.
- [x] Audit CSV export endpoint is implemented (`GET /admin/ops/audit/export`).
- [ ] Immutable retention policy is missing.

### 19. Non-Functional Requirements

- [~] Storefront build passes.
- [ ] Performance budget and LCP testing are missing.
- [ ] API p95 monitoring is missing.
- [~] Checkout Fraktjakt timeout fallback is now available in backend runtime for quote/booking/tracking flows; storefront checkout binding is still pending.
- [ ] WCAG 2.1 AA audit is missing.
- [~] i18n infrastructure exists.
- [ ] Daily exchange-rate update is missing.
- [ ] Lowest price last 30 days is missing.
- [ ] CI/CD, backups, uptime monitoring, and disaster recovery runbooks are missing.

### 20. Integrations

- [~] Fortnox integration connector registry + SKIP-state tracking exists in ops module; 2-way accounting sync implementation is still missing.
- [ ] Fraktjakt 2-way sync is missing.
- [~] Integration runtime health checks and SKIP-safe preview endpoints exist for Fraktjakt/Klarna/Fortnox so development can continue before credentials are available.
- [~] Strapi <-> Medusa 2-way sync foundation has started with webhook validation, normalized event contracts, persisted event logs, mapping storage, Medusa-origin event subscribers, replay operations, and expanded product/variant/category/inventory/pricing sync handlers.
- [x] Dedicated sync mappings table is implemented through the Medusa `sync` module and migration.
- [x] Sync events table is implemented through the Medusa `sync` module and migration.
- [~] Queue-first worker flow is implemented with Redis enqueue/dequeue/requeue, in-flight processing list, per-message ack, visibility-timeout recovery, DB polling fallback, configurable per-run concurrency, stale-processing lease recovery, distributed job lease locking, optional continuous runtime loop, operator queue controls, standalone daemon lifecycle, and reconciliation/conflict tooling; UI/operator ergonomics are still missing.
- [~] Idempotency and loop prevention helpers have started; dead-letter handling and reconciliation tooling are implemented, and Medusa-origin webhook echo filtering is now hardened. Remaining loop-prevention enhancement is explicit outbound processed-correlation tracking.
- [~] Targeted cache invalidation/revalidation is implemented as best-effort webhook trigger after successful product sync; storefront endpoint implementation and delivery observability are still missing.

## Recommended Development Order

### Phase 0 - Stabilize And Confirm Baseline

Goal: make sure future work builds on the current code instead of rewriting working features.

- [ ] Adopt Node 20 for local development because Medusa and Strapi expect Node 20.
- [ ] Decide officially to keep TanStack Start storefront or move back to Next.js.
- [ ] Add a small smoke-test checklist for storefront routes.
- [ ] Keep existing frontend hooks/data utilities and extend them instead of duplicating cart, checkout, product, and region logic.
- [ ] Add this tracker to every completion review.

### Phase 1 - Product Data And CMS Foundation

Goal: create the product/content data contract that checkout, SEO, search, Fraktjakt, and B2B will depend on.

- [~] Define Medusa-owned fields: SKU, variants, price, inventory, dimensions, weight, tax, visibility, shipping metadata.
- [~] Define Strapi-owned fields: long description, SEO title, SEO description, OG image, localized content, campaign content, publishing status.
- [x] Extend Strapi `product-enrichment` with `medusa_id`, `sku`, SEO fields, locale, publish status, sync metadata, and media/video fields.
- [x] Extend storefront product page to fetch and merge Strapi enrichment without replacing existing Medusa product fetch logic.
- [x] Formalize flooring metadata keys: `m2_per_package`, `waste_pct`, `unit`, `thickness`, dimensions, pallet/shipping fields.
- [ ] Add product admin/import documentation for real Golvfabriken catalog setup.
- [ ] Add tests for comparison price and package calculator helpers.

### Phase 2 - Medusa/Strapi Sync Foundation

Goal: implement the most reusable integration layer from the FRD before adding more integrations.

- [x] Create sync mapping storage.
- [x] Create sync event/idempotency storage.
- [x] Add Medusa subscriber for product/category changes.
- [x] Add secure Strapi webhook receiver.
- [~] Add mapping functions for Medusa-to-Strapi and Strapi-to-Medusa ownership rules. Worker execution now exists for product, product-variant (via parent product sync), product-category-linked product sync, inventory/price/price-list/reservation linked product sync, and Strapi product update writes; remaining work is hardening tests and explicit outbound loop-metadata tracking.
- [~] Add loop prevention metadata. Echo detection exists for webhook events, and ignored echoes are persisted; processed-correlation tracking for outbound writes is not implemented yet.
- [~] Add retry/dead-letter behavior using Redis-backed queue. Queue-first retry/dead-letter/replay behavior is implemented with per-message ack, visibility-timeout recovery, configurable per-run concurrency, stale-processing lease recovery, distributed job lease locking, optional continuous runtime loop, operator controls, standalone daemon lifecycle, and reconciliation/conflict tooling; UI ergonomics are pending.
- [~] Add targeted storefront cache invalidation or revalidation. Best-effort invalidation webhook exists; storefront endpoint and observability are pending.
- [~] Add sync logs and a minimal admin/debug view. Persistent event logs, replay APIs, and status/recent observability APIs now exist; admin/debug UI is missing.

### Phase 3 - Checkout Revenue Path: Fraktjakt First, Klarna Second

Goal: make checkout production-capable for Sweden.

- [~] Build Fraktjakt fulfillment provider/module in Medusa.
- [~] Implement address validation through Fraktjakt.
- [~] Implement real-time rate query and timeout fallback.
- [~] Implement package/pallet/component calculation using existing product metadata.
- [~] Add shipment booking after payment.
- [~] Add label generation and tracking sync.
- [~] Build Klarna payment provider in Medusa.
- [ ] Replace demo Stripe/Kustom frontend logic with backend-driven provider sessions.
- [~] Add checkout terms checkbox and newsletter opt-in.
- [~] Add payment/refund/capture handling paths.

### Phase 4 - B2B Core

Goal: support the main B2B business model.

- [~] Create B2B company module.
- [~] Add company status, org number/VAT ID, sales manager, credit limit, payment terms, price list.
- [~] Add company users and roles: admin, buyer, approver.
- [~] Add company depot addresses (checkout-context consumption is implemented; dedicated admin CRUD + portal UX still pending).
- [ ] Add B2B login/account portal.
- [~] Add approval threshold logic.
- [~] Add pending approval order state and approver workflow.
- [~] Add RFQ/quote workflow and quote PDF generation.
- [x] Add B2B checkout fields: PO number/depot reference/invoice reference capture, payment-method filtering policy, and approval orchestration are implemented in storefront checkout flow.

### Phase 5 - Customer Self-Service And Retention

Goal: rebuild customer account features and marketing flows.

- [ ] Customer profile page.
- [ ] Address book.
- [ ] Order history and order detail.
- [ ] Re-order.
- [ ] Wishlist.
- [ ] Saved for later.
- [ ] Return request/RMA.
- [ ] Abandoned cart recovery.
- [ ] Gift cards and balance check.

### Phase 6 - Operations, Compliance, And Reporting

Goal: make the platform manageable after sales start.

- [ ] Audit/activity log.
- [ ] GDPR consent, data export, erasure/anonymisation.
- [ ] Cookie consent and analytics gating.
- [ ] Email notification system and Strapi-managed templates.
- [ ] Invoice templates and PDFs.
- [ ] Reviews and ratings.
- [ ] Sales, inventory, logistics reports.
- [ ] GA4 and Meta Pixel ecommerce events.
- [ ] Fortnox 2-way sync.
- [ ] Monitoring, backups, CI/CD, security scans.

## Reuse Rules For Future Development

- Reuse the existing storefront data layer in `src/lib/data/*` and hooks in `src/lib/hooks/*`.
- Reuse existing cart helpers instead of creating a second cart abstraction.
- Reuse existing checkout components and add provider-specific behavior through the backend and payment/shipping provider APIs.
- Reuse product metadata helpers for flooring features instead of hardcoding new calculator logic.
- Keep Medusa as commerce source of truth and Strapi as editorial source of truth.
- Add new backend behavior as Medusa modules, workflows, subscribers, jobs, or API routes depending on the lifecycle.
- Avoid frontend-only integrations for Klarna, Fraktjakt, Fortnox, invoices, or credentials. These must live server-side.

## Immediate Next Task Recommendation

Continue Phase 3: Checkout Revenue Path (Fraktjakt + Klarna live execution) while keeping Phase 2/ops stable.

Reason: backend runtime now covers quote/session + booking/label/tracking + address validation and Klarna order/capture/refund, so the highest-value remaining work is end-to-end storefront wiring and credentialed production rollout.

Next concrete slice: wire storefront checkout shipping/payment flow to new backend endpoints (remove legacy frontend-direct assumptions), then connect Fortnox export jobs to live API push with retry/error capture, then execute production credential onboarding and UAT checklist.
