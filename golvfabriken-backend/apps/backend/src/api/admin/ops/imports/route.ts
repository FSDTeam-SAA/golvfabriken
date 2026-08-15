import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

type CreateImportJobPayload = {
  job_type?: "product_catalog" | "price_list" | "inventory" | "customer" | "order" | "other";
  source?: "csv" | "xlsx" | "api" | "manual";
  requested_by?: string;
  file_name?: string;
  file_path?: string;
  status?: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const status = req.query.status ? String(req.query.status) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const items = await opsService.getImportJobs({
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    imports: items,
  });
}

export async function POST(
  req: MedusaRequest<CreateImportJobPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const job = await opsService.createImportJob({
    jobType: payload.job_type,
    source: payload.source,
    requestedBy: payload.requested_by,
    fileName: payload.file_name,
    filePath: payload.file_path,
    status: payload.status,
    metadata: payload.metadata,
  });

  res.status(201).json({
    status: "ok",
    import_job: job,
  });
}
