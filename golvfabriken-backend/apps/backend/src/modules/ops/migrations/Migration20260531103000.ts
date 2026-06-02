import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260531103000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "ops_b2b_company" (
        "id" text not null,
        "name" text not null,
        "company_code" text not null,
        "organization_number" text null,
        "vat_id" text null,
        "status" text check ("status" in ('pending', 'active', 'suspended', 'rejected')) not null default 'pending',
        "sales_manager_id" text null,
        "credit_limit" double precision not null default 0,
        "payment_terms_days" double precision not null default 30,
        "spend_approval_threshold" double precision not null default 0,
        "price_list_code" text null,
        "default_currency_code" text not null default 'SEK',
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_b2b_company_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create unique index if not exists "IDX_ops_b2b_company_code_unique" on "ops_b2b_company" ("company_code") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_name" on "ops_b2b_company" ("name") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_status" on "ops_b2b_company" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_org_number" on "ops_b2b_company" ("organization_number") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_vat_id" on "ops_b2b_company" ("vat_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_deleted_at" on "ops_b2b_company" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_b2b_company_user" (
        "id" text not null,
        "company_id" text not null,
        "medusa_customer_id" text null,
        "email" text not null,
        "first_name" text null,
        "last_name" text null,
        "role" text check ("role" in ('admin', 'buyer', 'approver')) not null default 'buyer',
        "status" text check ("status" in ('invited', 'active', 'disabled')) not null default 'invited',
        "approval_limit" double precision not null default 0,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_b2b_company_user_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_user_company_id" on "ops_b2b_company_user" ("company_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_user_email" on "ops_b2b_company_user" ("email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_user_role" on "ops_b2b_company_user" ("role") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_user_status" on "ops_b2b_company_user" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_company_user_deleted_at" on "ops_b2b_company_user" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_b2b_order_approval" (
        "id" text not null,
        "company_id" text not null,
        "order_id" text not null,
        "requested_by_user_id" text null,
        "approver_user_id" text null,
        "status" text check ("status" in ('pending', 'approved', 'rejected', 'cancelled')) not null default 'pending',
        "amount_total" double precision not null default 0,
        "currency_code" text not null default 'SEK',
        "requested_at" timestamptz not null,
        "decided_at" timestamptz null,
        "decision_note" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_b2b_order_approval_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_order_approval_company_id" on "ops_b2b_order_approval" ("company_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_order_approval_order_id" on "ops_b2b_order_approval" ("order_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_order_approval_status" on "ops_b2b_order_approval" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_order_approval_deleted_at" on "ops_b2b_order_approval" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_b2b_quote_request" (
        "id" text not null,
        "company_id" text not null,
        "requested_by_user_id" text null,
        "customer_email" text null,
        "reference" text not null,
        "status" text check ("status" in ('requested', 'under_review', 'quoted', 'accepted', 'rejected', 'expired')) not null default 'requested',
        "currency_code" text not null default 'SEK',
        "requested_total" double precision not null default 0,
        "quoted_total" double precision null,
        "valid_until" timestamptz null,
        "note" text null,
        "items" jsonb null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_b2b_quote_request_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create unique index if not exists "IDX_ops_b2b_quote_request_reference_unique" on "ops_b2b_quote_request" ("reference") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_quote_request_company_id" on "ops_b2b_quote_request" ("company_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_quote_request_status" on "ops_b2b_quote_request" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_quote_request_customer_email" on "ops_b2b_quote_request" ("customer_email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_b2b_quote_request_deleted_at" on "ops_b2b_quote_request" ("deleted_at");`
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "ops_b2b_quote_request" cascade;`);
    this.addSql(`drop table if exists "ops_b2b_order_approval" cascade;`);
    this.addSql(`drop table if exists "ops_b2b_company_user" cascade;`);
    this.addSql(`drop table if exists "ops_b2b_company" cascade;`);
  }
}
