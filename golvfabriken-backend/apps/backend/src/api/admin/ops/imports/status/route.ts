import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type UpdateImportStatusPayload = {
  id?: string;
  status?: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
  processed_count?: number;
  failed_count?: number;
  error_report?: string;
  started_at?: string;
  finished_at?: string;
};

const allowedStatuses = new Set([
  "queued",
  "running",
  "completed",
  "completed_with_errors",
  "failed",
  "skipped",
]);

export async function POST(
  req: MedusaRequest<UpdateImportStatusPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const id = String(payload.id || "").trim();
  const status = String(payload.status || "").trim();

  if (!id) {
    res.status(400).json({ message: "id is required" });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({ message: "invalid status" });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const importJob = await opsService.updateImportJobStatus({
    id,
    status: status as any,
    processedCount: payload.processed_count,
    failedCount: payload.failed_count,
    errorReport: payload.error_report,
    startedAt: payload.started_at,
    finishedAt: payload.finished_at,
  });

  res.status(200).json({
    status: "ok",
    import_job: importJob,
  });
}
