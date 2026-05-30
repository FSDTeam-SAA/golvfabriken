# Operations Module (Client Request Coverage)

This module provides backend foundations for:

- Tax/VAT configuration tracking
- Complaint case intake and lifecycle tracking
- Return request lifecycle tracking
- Import job tracking
- Integration connector registry and SKIP-state tracking

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
GET/POST /admin/ops/tax-configurations
POST     /admin/ops/tax-configurations/quote-preview
GET/POST /admin/ops/imports
POST     /admin/ops/imports/status
POST     /admin/ops/imports/product-catalog/validate
POST     /admin/ops/imports/product-catalog/execute
GET      /admin/ops/imports/product-catalog/report?job_id=<impjob_id>
GET/POST /admin/ops/integrations
POST     /admin/ops/integrations/status
POST     /admin/ops/integrations/bootstrap
POST     /admin/ops/integrations/health-check
GET      /admin/ops/dashboard/status
POST     /admin/ops/shipping/quote-preview
POST     /admin/ops/payments/klarna/session-preview
GET/POST /admin/ops/accounting/fortnox/exports
```

## Storefront Intake Endpoints

```txt
POST /store/support/complaints
GET  /store/support/complaints/status
POST /store/support/returns
GET  /store/support/returns/status
POST /store/checkout/shipping/quote-preview
POST /store/checkout/payments/klarna/session-preview
POST /store/checkout/tax/quote-preview
```

## Integration SKIP Mode

When credentials are not ready, set integration connectors to:

- `status: skipped`
- `skip_reason: SKIP_UNTIL_API_KEYS_AVAILABLE`

This keeps planning and operational visibility active while external APIs are pending.

When `OPS_INTEGRATION_SIMULATION_MODE=true`, shipping/payment/accounting preview endpoints return simulated responses so frontend and ops flows can be tested before live API keys are available.
