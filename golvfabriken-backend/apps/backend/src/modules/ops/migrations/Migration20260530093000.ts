import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260530093000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "ops_complaint_case" (
        "id" text not null,
        "reference" text not null,
        "order_id" text null,
        "customer_id" text null,
        "customer_email" text null,
        "channel" text check ("channel" in ('storefront', 'admin', 'support')) not null default 'storefront',
        "type" text check ("type" in ('complaint', 'damage', 'delivery_issue', 'quality_issue', 'billing_issue', 'other')) not null default 'complaint',
        "status" text check ("status" in ('open', 'investigating', 'resolved', 'rejected', 'closed')) not null default 'open',
        "priority" text check ("priority" in ('low', 'medium', 'high', 'critical')) not null default 'medium',
        "summary" text not null,
        "description" text null,
        "resolution" text null,
        "resolved_at" timestamptz null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_complaint_case_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create unique index if not exists "IDX_ops_complaint_case_reference_unique" on "ops_complaint_case" ("reference") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_order_id" on "ops_complaint_case" ("order_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_customer_id" on "ops_complaint_case" ("customer_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_customer_email" on "ops_complaint_case" ("customer_email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_type" on "ops_complaint_case" ("type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_status" on "ops_complaint_case" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_complaint_case_deleted_at" on "ops_complaint_case" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_return_request_case" (
        "id" text not null,
        "complaint_case_id" text null,
        "order_id" text not null,
        "customer_id" text null,
        "customer_email" text null,
        "reason" text check ("reason" in ('damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'other')) not null default 'other',
        "status" text check ("status" in ('requested', 'approved', 'rejected', 'received', 'refunded', 'closed')) not null default 'requested',
        "notes" text null,
        "requested_at" timestamptz not null,
        "approved_at" timestamptz null,
        "rejected_at" timestamptz null,
        "received_at" timestamptz null,
        "refunded_at" timestamptz null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_return_request_case_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_complaint_case_id" on "ops_return_request_case" ("complaint_case_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_order_id" on "ops_return_request_case" ("order_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_customer_id" on "ops_return_request_case" ("customer_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_customer_email" on "ops_return_request_case" ("customer_email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_reason" on "ops_return_request_case" ("reason") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_status" on "ops_return_request_case" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_return_request_case_deleted_at" on "ops_return_request_case" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_tax_configuration" (
        "id" text not null,
        "country_code" text not null,
        "region_code" text null,
        "currency_code" text null,
        "vat_rate" double precision null,
        "is_tax_inclusive" boolean not null default false,
        "eu_oss_enabled" boolean not null default false,
        "reverse_charge_enabled" boolean not null default false,
        "status" text check ("status" in ('draft', 'active', 'archived')) not null default 'draft',
        "notes" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_tax_configuration_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_tax_configuration_country_code" on "ops_tax_configuration" ("country_code") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_tax_configuration_region_code" on "ops_tax_configuration" ("region_code") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_tax_configuration_currency_code" on "ops_tax_configuration" ("currency_code") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_tax_configuration_status" on "ops_tax_configuration" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_tax_configuration_deleted_at" on "ops_tax_configuration" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_import_job" (
        "id" text not null,
        "job_type" text check ("job_type" in ('product_catalog', 'price_list', 'inventory', 'customer', 'order', 'other')) not null default 'product_catalog',
        "source" text check ("source" in ('csv', 'xlsx', 'api', 'manual')) not null default 'csv',
        "status" text check ("status" in ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'skipped')) not null default 'queued',
        "requested_by" text null,
        "file_name" text null,
        "file_path" text null,
        "processed_count" double precision not null default 0,
        "failed_count" double precision not null default 0,
        "started_at" timestamptz null,
        "finished_at" timestamptz null,
        "error_report" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_import_job_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_import_job_job_type" on "ops_import_job" ("job_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_import_job_source" on "ops_import_job" ("source") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_import_job_status" on "ops_import_job" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_import_job_deleted_at" on "ops_import_job" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_integration_connector" (
        "id" text not null,
        "key" text not null,
        "display_name" text not null,
        "category" text check ("category" in ('shipping', 'payment', 'accounting', 'erp', 'cms', 'analytics', 'other')) not null default 'other',
        "status" text check ("status" in ('planned', 'active', 'paused', 'error', 'skipped')) not null default 'planned',
        "skip_reason" text null,
        "base_url" text null,
        "last_health_check_at" timestamptz null,
        "last_error" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_integration_connector_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create unique index if not exists "IDX_ops_integration_connector_key_unique" on "ops_integration_connector" ("key") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_integration_connector_category" on "ops_integration_connector" ("category") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_integration_connector_status" on "ops_integration_connector" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_integration_connector_deleted_at" on "ops_integration_connector" ("deleted_at");`
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "ops_integration_connector" cascade;`);
    this.addSql(`drop table if exists "ops_import_job" cascade;`);
    this.addSql(`drop table if exists "ops_tax_configuration" cascade;`);
    this.addSql(`drop table if exists "ops_return_request_case" cascade;`);
    this.addSql(`drop table if exists "ops_complaint_case" cascade;`);
  }
}
