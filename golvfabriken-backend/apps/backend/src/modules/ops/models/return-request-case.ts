import { model } from "@medusajs/framework/utils";

const ReturnRequestCase = model.define("ops_return_request_case", {
  id: model.id({ prefix: "retreq" }).primaryKey(),
  complaint_case_id: model.text().index().nullable(),
  order_id: model.text().index(),
  customer_id: model.text().index().nullable(),
  customer_email: model.text().index().nullable(),
  reason: model
    .enum(["damaged", "wrong_item", "not_as_described", "changed_mind", "other"])
    .default("other")
    .index(),
  status: model
    .enum(["requested", "approved", "rejected", "received", "refunded", "closed"])
    .default("requested")
    .index(),
  notes: model.text().nullable(),
  requested_at: model.dateTime(),
  approved_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  refunded_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

export default ReturnRequestCase;
