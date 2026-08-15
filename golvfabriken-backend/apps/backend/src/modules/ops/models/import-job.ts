import { model } from "@medusajs/framework/utils";

const ImportJob = model.define("ops_import_job", {
  id: model.id({ prefix: "impjob" }).primaryKey(),
  job_type: model
    .enum(["product_catalog", "price_list", "inventory", "customer", "order", "other"])
    .default("product_catalog")
    .index(),
  source: model.enum(["csv", "xlsx", "api", "manual"]).default("csv").index(),
  status: model
    .enum(["queued", "running", "completed", "completed_with_errors", "failed", "skipped"])
    .default("queued")
    .index(),
  requested_by: model.text().nullable(),
  file_name: model.text().nullable(),
  file_path: model.text().nullable(),
  processed_count: model.number().default(0),
  failed_count: model.number().default(0),
  started_at: model.dateTime().nullable(),
  finished_at: model.dateTime().nullable(),
  error_report: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default ImportJob;
