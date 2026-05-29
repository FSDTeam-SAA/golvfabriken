import { model } from "@medusajs/framework/utils";

const SyncMapping = model.define("sync_mapping", {
  id: model.id({ prefix: "syncmap" }).primaryKey(),
  entity_type: model.text().index(),
  medusa_id: model.text().index().nullable(),
  strapi_document_id: model.text().index().nullable(),
  strapi_numeric_id: model.text().index().nullable(),
  locale: model.text().index().nullable(),
  last_synced_at: model.dateTime().nullable(),
  last_source: model.enum(["medusa", "strapi", "system"]).index().nullable(),
  checksum: model.text().index().nullable(),
  sync_status: model
    .enum(["pending", "synced", "failed", "conflict"])
    .default("pending")
    .index(),
  last_error: model.text().nullable(),
});

export default SyncMapping;
