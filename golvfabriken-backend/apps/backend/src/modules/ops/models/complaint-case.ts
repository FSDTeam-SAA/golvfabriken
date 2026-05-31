import { model } from "@medusajs/framework/utils";

const ComplaintCase = model.define("ops_complaint_case", {
  id: model.id({ prefix: "cmp" }).primaryKey(),
  reference: model.text().index().unique(),
  order_id: model.text().index().nullable(),
  customer_id: model.text().index().nullable(),
  customer_email: model.text().index().nullable(),
  channel: model.enum(["storefront", "admin", "support"]).default("storefront"),
  type: model
    .enum([
      "complaint",
      "damage",
      "delivery_issue",
      "quality_issue",
      "billing_issue",
      "other",
    ])
    .default("complaint")
    .index(),
  status: model
    .enum(["open", "investigating", "resolved", "rejected", "closed"])
    .default("open")
    .index(),
  priority: model.enum(["low", "medium", "high", "critical"]).default("medium"),
  summary: model.text(),
  description: model.text().nullable(),
  resolution: model.text().nullable(),
  resolved_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

export default ComplaintCase;
