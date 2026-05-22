# Golvfabriken Ecommerce Development Tracker

Last reviewed: 2026-05-22

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
- Backend build status: `npm --prefix golvfabriken-backend/apps/backend run build` passed on 2026-05-22 after the first Medusa/Strapi sync foundation slice.
- Important worktree note: the repository already has a large uncommitted storefront migration/change set. Avoid reverting unrelated existing changes.

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
- [~] Strapi webhook processing has started: backend now validates and normalizes Strapi webhook events, but does not persist or dispatch them yet.
- [ ] Automated Medusa/Strapi sync worker is missing.

## Not Completed Yet By FRD Module

### 1. System Overview And Architecture

- [~] Three-system architecture exists: Medusa, Strapi, storefront.
- [ ] FRD integration rule is not complete: Fraktjakt and Klarna must be called only from Medusa backend.
- [~] Dedicated integration layer has started with shared sync event utilities and a secure Strapi webhook receiver; queue/worker persistence is still missing.
- [ ] Role-based architecture across Super Admin, Sales Manager, Content Editor, Logistics Lead, B2B Company Admin, Buyer, Approver, and B2C Customer is not implemented.

### 2. Authentication And Security

- [~] Medusa native auth foundation exists.
- [ ] Customer account frontend was removed during the migration and needs rebuilding.
- [ ] Social OAuth is not implemented.
- [ ] Magic link/OTP is not implemented.
- [ ] 2FA for admin and B2B roles is not implemented.
- [ ] Account lockout, concurrent session limits, logout-all-devices, and password reset policy are not custom implemented.
- [ ] Redis-backed rate limiting is not implemented.
- [ ] Audit logging for admin actions is not implemented.
- [ ] GDPR anonymisation workflow is not implemented.
- [ ] Dependency scanning/CI security checks are not configured.

### 3. Customer Management B2C

- [ ] Customer profile UI is missing.
- [ ] Customer address book UI is missing.
- [ ] Saved billing/shipping address selection in checkout is missing.
- [ ] Wishlist module is missing.
- [ ] Customer order history page is missing.
- [ ] Re-order action is missing.
- [ ] Customer return request flow is missing.
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

- [ ] Company profile module is missing.
- [ ] Company approval flow is missing.
- [ ] Company user roles are missing.
- [ ] B2B company price lists and credit limits are missing.
- [ ] Payment terms and payment method restrictions are missing.
- [ ] Spend approval threshold is missing.
- [ ] Order approval workflow is missing.
- [ ] RFQ/quote module is missing.
- [ ] Company depot addresses are missing.
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
- [ ] Fraktjakt address validation is missing.
- [ ] Fraktjakt real-time shipping rates are missing.
- [ ] Newsletter opt-in at checkout is missing.
- [ ] Terms acceptance checkbox is missing.
- [ ] Saved-for-later is missing.
- [ ] Abandoned cart recovery is missing.
- [ ] Cart cross-sell display is missing.
- [ ] B2B checkout differences are missing: PO number, depot dropdown, approval gate, filtered payment methods, invoice reference.

### 8. Promotions And Marketing

- [~] Medusa promotion code apply/remove is wired in storefront.
- [ ] Admin configuration and validation of FRD promotion rules has not been verified.
- [ ] Automatic promotions such as tiered, bundle, and flash-sale rules are not built in the storefront/admin flow.
- [ ] Abandoned cart recovery is missing.
- [ ] Gift card purchase, redemption, and balance check pages are missing.

### 9. Orders And Fulfillment

- [~] Basic order confirmation display exists.
- [ ] Custom order lifecycle including B2B pending approval is missing.
- [ ] Admin order detail extension from FRD is missing.
- [ ] Internal/customer notes and resend confirmation action are missing.
- [ ] Returns/RMA workflow is missing.
- [ ] Return label generation is missing.
- [ ] Partial refunds and restocking workflow are missing.

### 10. Fraktjakt Integration

- [ ] Fraktjakt backend provider/module is missing.
- [ ] Query/Requery/Order/Shipment/Track/Cancel/Return/Address/Customs API handling is missing.
- [ ] Real-time rate calculation is missing.
- [ ] Fraktjakt timeout fallback is missing.
- [ ] Pallet and B2B shipment model is missing.
- [ ] Multi-component/unit-level transmission is missing.
- [ ] Label/document generation is missing.
- [ ] Shipment tracking webhooks are missing.
- [ ] Public tracking page is missing.

### 11. Payments - Klarna

- [ ] Klarna backend payment provider is missing.
- [ ] Klarna API credential management is missing.
- [ ] Klarna test/production mode config is missing.
- [ ] Klarna Pay Now, Pay Later, Instalments, B2B Invoice are not production implemented.
- [ ] Swish is missing.
- [ ] Bank transfer/invoice workflow is missing.
- [ ] Klarna refund, capture, dispute, and reconciliation handling is missing.

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
- [ ] CSV export for reports is missing.
- [ ] Scheduled reports are missing.
- [ ] GA4 ecommerce events are missing.
- [ ] Meta Pixel is missing.
- [ ] Klarna settlement report export is missing.

### 15. GDPR And Privacy Compliance

- [ ] Cookie consent banner is missing.
- [ ] Consent version/timestamp storage is missing.
- [ ] Privacy policy CMS page is missing.
- [ ] Customer data export is missing.
- [ ] Right-to-erasure anonymisation is missing.
- [ ] Retention policy automation is missing.
- [ ] B2B DPA content flow is missing.
- [ ] Breach notification logging is missing.

### 16. Webhook And Event System

- [~] Medusa and Strapi support events/webhooks at framework level.
- [~] Custom event contract from the FRD has started through a normalized sync event model.
- [ ] Endpoint registration UI is missing.
- [~] Delivery retry/logs/signature/event filtering are partially started: Strapi secret validation and echo filtering exist, but retry logs and endpoint registration are missing.
- [x] Event payload standard is implemented for the first Strapi-to-Medusa webhook slice.

### 17. Settings And Configuration

- [~] Medusa has native store, region, tax, shipping, API key foundations.
- [ ] FRD-specific store settings UI is missing.
- [ ] Swedish VAT presets and EU OSS/reverse-charge workflows are not configured.
- [ ] Shipping zones with Fraktjakt real-time method are missing.
- [ ] Email notification settings are missing.
- [ ] Encrypted external integration credential management is missing.

### 18. Audit And Activity Log

- [ ] Append-only audit log module is missing.
- [ ] Before/after state snapshots are missing.
- [ ] Audit CSV export is missing.
- [ ] Immutable retention policy is missing.

### 19. Non-Functional Requirements

- [~] Storefront build passes.
- [ ] Performance budget and LCP testing are missing.
- [ ] API p95 monitoring is missing.
- [ ] Checkout Fraktjakt timeout fallback is missing.
- [ ] WCAG 2.1 AA audit is missing.
- [~] i18n infrastructure exists.
- [ ] Daily exchange-rate update is missing.
- [ ] Lowest price last 30 days is missing.
- [ ] CI/CD, backups, uptime monitoring, and disaster recovery runbooks are missing.

### 20. Integrations

- [ ] Fortnox 2-way sync is missing.
- [ ] Fraktjakt 2-way sync is missing.
- [~] Strapi <-> Medusa 2-way sync foundation has started with webhook validation and normalized event contracts.
- [~] Dedicated sync mappings table is missing, but its record shape is now defined in code.
- [~] Sync events table is missing, but its idempotency/event record shape is now defined in code.
- [ ] Queue worker is missing.
- [~] Idempotency and loop prevention helpers have started; conflict handling, dead-letter queue, and reconciliation job are missing.
- [ ] Targeted cache invalidation/revalidation is missing.

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

- [~] Create sync mapping storage. Record shape is defined; persistence is not implemented yet.
- [~] Create sync event/idempotency storage. Record shape and checksum/event ID helpers are defined; persistence is not implemented yet.
- [ ] Add Medusa subscriber for product/category changes.
- [x] Add secure Strapi webhook receiver.
- [~] Add mapping functions for Medusa-to-Strapi and Strapi-to-Medusa ownership rules. Strapi event normalization exists; target write mappers are not implemented yet.
- [~] Add loop prevention metadata. Echo detection exists for webhook events; persisted processed-correlation tracking is not implemented yet.
- [ ] Add retry/dead-letter behavior using Redis-backed queue.
- [ ] Add targeted storefront cache invalidation or revalidation.
- [~] Add sync logs and a minimal admin/debug view. Webhook response returns normalized event details for debugging; persistent logs and admin UI are missing.

### Phase 3 - Checkout Revenue Path: Fraktjakt First, Klarna Second

Goal: make checkout production-capable for Sweden.

- [ ] Build Fraktjakt fulfillment provider/module in Medusa.
- [ ] Implement address validation through Fraktjakt.
- [ ] Implement real-time rate query and timeout fallback.
- [ ] Implement package/pallet/component calculation using existing product metadata.
- [ ] Add shipment booking after payment.
- [ ] Add label generation and tracking sync.
- [ ] Build Klarna payment provider in Medusa.
- [ ] Replace demo Stripe/Kustom frontend logic with backend-driven provider sessions.
- [ ] Add checkout terms checkbox and newsletter opt-in.
- [ ] Add payment/refund/capture handling paths.

### Phase 4 - B2B Core

Goal: support the main B2B business model.

- [ ] Create B2B company module.
- [ ] Add company status, org number/VAT ID, sales manager, credit limit, payment terms, price list.
- [ ] Add company users and roles: admin, buyer, approver.
- [ ] Add company depot addresses.
- [ ] Add B2B login/account portal.
- [ ] Add approval threshold logic.
- [ ] Add pending approval order state and approver workflow.
- [ ] Add RFQ/quote workflow and quote PDF generation.
- [ ] Add B2B checkout fields: PO number, depot, invoice reference, filtered payment methods.

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

Continue Phase 2: Medusa/Strapi Sync Foundation.

Reason: product/CMS enrichment is now wired enough for a real sync layer to start. The next blocker is persistence: `sync_events` and `sync_mappings` must be saved before we dispatch work to Redis or write back across systems.

Next concrete slice: add Medusa module/database persistence for sync mappings and sync events, then update the Strapi webhook route to store events and ignore duplicate `event_id` values.
