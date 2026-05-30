import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const jobId = String(req.query.job_id || "").trim();

  if (!jobId) {
    res.status(400).json({
      message: "job_id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const result = await opsService.getProductCatalogImportReport({
    jobId,
  });

  if (!result) {
    res.status(404).json({
      message: "Import report not found",
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    import_report: result,
  });
}
