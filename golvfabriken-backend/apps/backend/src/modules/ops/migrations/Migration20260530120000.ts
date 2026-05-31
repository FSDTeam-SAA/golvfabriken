import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260530120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "ops_audit_log" (
        "id" text not null,
        "entity_type" text not null,
        "entity_id" text null,
        "action" text not null,
        "actor_type" text check ("actor_type" in ('admin', 'system', 'storefront', 'integration')) not null default 'system',
        "actor_id" text null,
        "actor_email" text null,
        "source" text null,
        "before_state" jsonb null,
        "after_state" jsonb null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_audit_log_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_entity_type" on "ops_audit_log" ("entity_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_entity_id" on "ops_audit_log" ("entity_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_action" on "ops_audit_log" ("action") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_actor_type" on "ops_audit_log" ("actor_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_actor_id" on "ops_audit_log" ("actor_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_actor_email" on "ops_audit_log" ("actor_email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_audit_log_deleted_at" on "ops_audit_log" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "ops_privacy_request" (
        "id" text not null,
        "request_type" text check ("request_type" in ('data_export', 'anonymize', 'erasure')) not null default 'data_export',
        "status" text check ("status" in ('requested', 'in_progress', 'completed', 'rejected', 'skipped')) not null default 'requested',
        "customer_id" text null,
        "customer_email" text null,
        "requested_by" text null,
        "notes" text null,
        "result_summary" text null,
        "payload" jsonb null,
        "started_at" timestamptz null,
        "completed_at" timestamptz null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "ops_privacy_request_pkey" primary key ("id")
      );`
    );
    this.addSql(
      `create index if not exists "IDX_ops_privacy_request_type" on "ops_privacy_request" ("request_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_privacy_request_status" on "ops_privacy_request" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_privacy_request_customer_id" on "ops_privacy_request" ("customer_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_privacy_request_customer_email" on "ops_privacy_request" ("customer_email") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_ops_privacy_request_deleted_at" on "ops_privacy_request" ("deleted_at");`
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "ops_privacy_request" cascade;`);
    this.addSql(`drop table if exists "ops_audit_log" cascade;`);
  }
}
