import { model } from "@medusajs/framework/utils";

const B2BQuoteRequest = model.define("ops_b2b_quote_request", {
  id: model.id({ prefix: "b2brfq" }).primaryKey(),
  company_id: model.text().index(),
  requested_by_user_id: model.text().index().nullable(),
  customer_email: model.text().index().nullable(),
  reference: model.text().index().unique(),
  status: model
    .enum(["requested", "under_review", "quoted", "accepted", "rejected", "expired"])
    .default("requested")
    .index(),
  currency_code: model.text().default("SEK"),
  requested_total: model.number().default(0),
  quoted_total: model.number().nullable(),
  valid_until: model.dateTime().nullable(),
  note: model.text().nullable(),
  items: model.json().nullable(),
  metadata: model.json().nullable(),
});

export default B2BQuoteRequest;
