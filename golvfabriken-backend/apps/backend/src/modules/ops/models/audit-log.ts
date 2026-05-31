import { model } from "@medusajs/framework/utils";

const AuditLog = model.define("ops_audit_log", {
  id: model.id({ prefix: "audit" }).primaryKey(),
  entity_type: model.text().index(),
  entity_id: model.text().index().nullable(),
  action: model.text().index(),
  actor_type: model
    .enum(["admin", "system", "storefront", "integration"])
    .default("system")
    .index(),
  actor_id: model.text().index().nullable(),
  actor_email: model.text().index().nullable(),
  source: model.text().nullable(),
  before_state: model.json().nullable(),
  after_state: model.json().nullable(),
  metadata: model.json().nullable(),
});

export default AuditLog;
