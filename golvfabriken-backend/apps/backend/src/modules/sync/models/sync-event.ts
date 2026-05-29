import { model } from "@medusajs/framework/utils";

const SyncEvent = model.define("sync_event", {
  id: model.id({ prefix: "syncevt" }).primaryKey(),
  event_id: model.text().unique(),
  correlation_id: model.text().index(),
  source_system: model.enum(["medusa", "strapi", "system"]).index(),
  target_system: model.enum(["medusa", "strapi", "frontend", "system"]).index(),
  entity_type: model.text().index(),
  entity_id: model.text().index(),
  external_id: model.text().index().nullable(),
  operation: model
    .enum(["create", "update", "delete", "publish", "unpublish", "unknown"])
    .index(),
  changed_fields: model.array().default([]),
  origin: model.enum(["user", "integration", "system", "scheduled_sync"]).index(),
  occurred_at: model.dateTime(),
  payload_checksum: model.text().index(),
  raw_event_name: model.text().nullable(),
  status: model
    .enum(["received", "processing", "processed", "failed", "ignored"])
    .default("received")
    .index(),
  attempt_count: model.number().default(0),
  processed_at: model.dateTime().nullable(),
  error_message: model.text().nullable(),
  raw_payload: model.json().nullable(),
});

export default SyncEvent;
