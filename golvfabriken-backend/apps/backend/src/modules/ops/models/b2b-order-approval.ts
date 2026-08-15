import { model } from "@medusajs/framework/utils";

const B2BOrderApproval = model.define("ops_b2b_order_approval", {
  id: model.id({ prefix: "b2bapp" }).primaryKey(),
  company_id: model.text().index(),
  order_id: model.text().index(),
  requested_by_user_id: model.text().index().nullable(),
  approver_user_id: model.text().index().nullable(),
  status: model
    .enum(["pending", "approved", "rejected", "cancelled"])
    .default("pending")
    .index(),
  amount_total: model.number().default(0),
  currency_code: model.text().default("SEK"),
  requested_at: model.dateTime(),
  decided_at: model.dateTime().nullable(),
  decision_note: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default B2BOrderApproval;
