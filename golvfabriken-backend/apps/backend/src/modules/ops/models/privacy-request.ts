import { model } from "@medusajs/framework/utils";

const PrivacyRequest = model.define("ops_privacy_request", {
  id: model.id({ prefix: "privreq" }).primaryKey(),
  request_type: model
    .enum(["data_export", "anonymize", "erasure"])
    .default("data_export")
    .index(),
  status: model
    .enum(["requested", "in_progress", "completed", "rejected", "skipped"])
    .default("requested")
    .index(),
  customer_id: model.text().index().nullable(),
  customer_email: model.text().index().nullable(),
  requested_by: model.text().nullable(),
  notes: model.text().nullable(),
  result_summary: model.text().nullable(),
  payload: model.json().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

export default PrivacyRequest;
