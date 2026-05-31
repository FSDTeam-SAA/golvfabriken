import { model } from "@medusajs/framework/utils";

const IntegrationConnector = model.define("ops_integration_connector", {
  id: model.id({ prefix: "intg" }).primaryKey(),
  key: model.text().index().unique(),
  display_name: model.text(),
  category: model
    .enum(["shipping", "payment", "accounting", "erp", "cms", "analytics", "other"])
    .default("other")
    .index(),
  status: model.enum(["planned", "active", "paused", "error", "skipped"]).default("planned").index(),
  skip_reason: model.text().nullable(),
  base_url: model.text().nullable(),
  last_health_check_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default IntegrationConnector;
