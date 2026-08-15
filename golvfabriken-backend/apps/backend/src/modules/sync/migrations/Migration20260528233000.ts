import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260528233000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "sync_event" (
        "id" text not null,
        "event_id" text not null,
        "correlation_id" text not null,
        "source_system" text check ("source_system" in ('medusa', 'strapi', 'system')) not null,
        "target_system" text check ("target_system" in ('medusa', 'strapi', 'frontend', 'system')) not null,
        "entity_type" text not null,
        "entity_id" text not null,
        "external_id" text null,
        "operation" text check ("operation" in ('create', 'update', 'delete', 'publish', 'unpublish', 'unknown')) not null,
        "changed_fields" text[] not null default '{}',
        "origin" text check ("origin" in ('user', 'integration', 'system', 'scheduled_sync')) not null,
        "occurred_at" timestamptz not null,
        "payload_checksum" text not null,
        "raw_event_name" text null,
        "status" text check ("status" in ('received', 'processing', 'processed', 'failed', 'ignored')) not null default 'received',
        "attempt_count" integer not null default 0,
        "processed_at" timestamptz null,
        "error_message" text null,
        "raw_payload" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "sync_event_pkey" primary key ("id")
      );`
    );

    this.addSql(
      `create unique index if not exists "IDX_sync_event_event_id_unique" on "sync_event" ("event_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_correlation_id" on "sync_event" ("correlation_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_source_system" on "sync_event" ("source_system") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_target_system" on "sync_event" ("target_system") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_entity_type" on "sync_event" ("entity_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_entity_id" on "sync_event" ("entity_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_external_id" on "sync_event" ("external_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_operation" on "sync_event" ("operation") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_origin" on "sync_event" ("origin") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_payload_checksum" on "sync_event" ("payload_checksum") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_status" on "sync_event" ("status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_event_deleted_at" on "sync_event" ("deleted_at");`
    );

    this.addSql(
      `create table if not exists "sync_mapping" (
        "id" text not null,
        "entity_type" text not null,
        "medusa_id" text null,
        "strapi_document_id" text null,
        "strapi_numeric_id" text null,
        "locale" text null,
        "last_synced_at" timestamptz null,
        "last_source" text check ("last_source" in ('medusa', 'strapi', 'system')) null,
        "checksum" text null,
        "sync_status" text check ("sync_status" in ('pending', 'synced', 'failed', 'conflict')) not null default 'pending',
        "last_error" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "sync_mapping_pkey" primary key ("id")
      );`
    );

    this.addSql(
      `create index if not exists "IDX_sync_mapping_entity_type" on "sync_mapping" ("entity_type") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_medusa_id" on "sync_mapping" ("medusa_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_strapi_document_id" on "sync_mapping" ("strapi_document_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_strapi_numeric_id" on "sync_mapping" ("strapi_numeric_id") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_locale" on "sync_mapping" ("locale") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_last_source" on "sync_mapping" ("last_source") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_checksum" on "sync_mapping" ("checksum") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_sync_status" on "sync_mapping" ("sync_status") where deleted_at is null;`
    );
    this.addSql(
      `create index if not exists "IDX_sync_mapping_deleted_at" on "sync_mapping" ("deleted_at");`
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "sync_mapping" cascade;`);
    this.addSql(`drop table if exists "sync_event" cascade;`);
  }
}
