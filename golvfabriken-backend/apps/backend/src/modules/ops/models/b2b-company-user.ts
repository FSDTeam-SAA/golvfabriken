import { model } from "@medusajs/framework/utils";

const B2BCompanyUser = model.define("ops_b2b_company_user", {
  id: model.id({ prefix: "b2busr" }).primaryKey(),
  company_id: model.text().index(),
  medusa_customer_id: model.text().index().nullable(),
  email: model.text().index(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  role: model.enum(["admin", "buyer", "approver"]).default("buyer").index(),
  status: model.enum(["invited", "active", "disabled"]).default("invited").index(),
  approval_limit: model.number().default(0),
  metadata: model.json().nullable(),
});

export default B2BCompanyUser;
