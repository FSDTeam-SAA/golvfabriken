import { model } from "@medusajs/framework/utils";

const TaxConfiguration = model.define("ops_tax_configuration", {
  id: model.id({ prefix: "taxcfg" }).primaryKey(),
  country_code: model.text().index(),
  region_code: model.text().index().nullable(),
  currency_code: model.text().index().nullable(),
  vat_rate: model.number().nullable(),
  is_tax_inclusive: model.boolean().default(false),
  eu_oss_enabled: model.boolean().default(false),
  reverse_charge_enabled: model.boolean().default(false),
  status: model.enum(["draft", "active", "archived"]).default("draft").index(),
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default TaxConfiguration;
