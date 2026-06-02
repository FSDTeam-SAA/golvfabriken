import { model } from "@medusajs/framework/utils";

const B2BCompany = model.define("ops_b2b_company", {
  id: model.id({ prefix: "b2bco" }).primaryKey(),
  name: model.text().index(),
  company_code: model.text().index().unique(),
  organization_number: model.text().index().nullable(),
  vat_id: model.text().index().nullable(),
  status: model
    .enum(["pending", "active", "suspended", "rejected"])
    .default("pending")
    .index(),
  sales_manager_id: model.text().nullable(),
  credit_limit: model.number().default(0),
  payment_terms_days: model.number().default(30),
  spend_approval_threshold: model.number().default(0),
  price_list_code: model.text().nullable(),
  default_currency_code: model.text().default("SEK"),
  metadata: model.json().nullable(),
});

export default B2BCompany;
