# Operations Module (Client Request Coverage)

This module provides backend foundations for:

- Tax/VAT configuration tracking
- Complaint case intake and lifecycle tracking
- Return request lifecycle tracking
- Import job tracking
- Integration connector registry and SKIP-state tracking
- Audit/activity log foundation
- Privacy request workflow (export/anonymize)
- Ops summary reporting + CSV export
- B2B company/user/approval/RFQ operational foundation

## Admin Security

Set:

```txt
OPS_ADMIN_SECRET=replace_me
OPS_INTEGRATION_SIMULATION_MODE=true
```

Pass it in admin ops requests:

```txt
x-ops-admin-secret: <OPS_ADMIN_SECRET>
```

## Admin Endpoints

```txt
GET/POST /admin/ops/complaints
POST     /admin/ops/complaints/status
GET/POST /admin/ops/returns
POST     /admin/ops/returns/status
GET      /admin/ops/audit
GET      /admin/ops/audit/export
GET/POST /admin/ops/b2b/companies
POST     /admin/ops/b2b/companies/status
GET/POST /admin/ops/b2b/users
POST     /admin/ops/b2b/users/status
GET/POST /admin/ops/b2b/approvals
POST     /admin/ops/b2b/approvals/decision
GET/POST /admin/ops/b2b/quotes
POST     /admin/ops/b2b/quotes/status
GET/POST /admin/ops/tax-configurations
POST     /admin/ops/tax-configurations/quote-preview
GET/POST /admin/ops/imports
POST     /admin/ops/imports/status
POST     /admin/ops/imports/product-catalog/validate
POST     /admin/ops/imports/product-catalog/execute
GET      /admin/ops/imports/product-catalog/report?job_id=<impjob_id>
GET/POST /admin/ops/privacy/requests
POST     /admin/ops/privacy/requests/status
POST     /admin/ops/privacy/requests/export-preview
POST     /admin/ops/privacy/requests/anonymize
GET/POST /admin/ops/integrations
POST     /admin/ops/integrations/status
POST     /admin/ops/integrations/bootstrap
POST     /admin/ops/integrations/health-check
GET      /admin/ops/dashboard/status
GET      /admin/ops/reports/summary
GET      /admin/ops/reports/summary/export
POST     /admin/ops/shipping/quote-preview
POST     /admin/ops/shipping/address-validate
POST     /admin/ops/shipping/booking
POST     /admin/ops/shipping/label
GET      /admin/ops/shipping/tracking?shipment_id=<id>
POST     /admin/ops/payments/klarna/session-preview
POST     /admin/ops/payments/klarna/order
POST     /admin/ops/payments/klarna/capture
POST     /admin/ops/payments/klarna/refund
POST     /admin/ops/flooring/coverage
GET/POST /admin/ops/accounting/fortnox/exports
```

## Storefront Intake Endpoints

```txt
POST /store/support/complaints
GET  /store/support/complaints/status
POST /store/support/returns
GET  /store/support/returns/status
POST /store/support/privacy/requests
POST /store/b2b/companies/register
POST /store/b2b/approvals/submit
POST /store/b2b/quotes/request
POST /store/checkout/shipping/quote-preview
POST /store/checkout/shipping/address-validate
POST /store/checkout/shipping/booking
GET  /store/checkout/shipping/tracking?shipment_id=<id>
POST /store/checkout/payments/klarna/session-preview
POST /store/checkout/payments/klarna/order
POST /store/checkout/tax/quote-preview
POST /store/checkout/flooring/coverage
```

## Integration SKIP Mode

When credentials are not ready, set integration connectors to:

- `status: skipped`
- `skip_reason: SKIP_UNTIL_API_KEYS_AVAILABLE`

This keeps planning and operational visibility active while external APIs are pending.

When `OPS_INTEGRATION_SIMULATION_MODE=true`, shipping/payment/accounting preview endpoints return simulated responses so frontend and ops flows can be tested before live API keys are available.

When provider credentials are configured and simulation is not required, shipping and Klarna endpoints attempt live provider calls first and fall back to simulation mode if timeout/live errors happen (configurable via timeout env values).

Shipping quote/booking runtime now also derives a package plan (pallet count, loading meters, component totals, shipment types) from line-item metadata fields so Fraktjakt payload shaping can be reused across quote + booking flows.
