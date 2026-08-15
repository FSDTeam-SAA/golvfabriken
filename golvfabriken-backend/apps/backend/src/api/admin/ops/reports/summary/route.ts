import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const summary = await opsService.getOpsDashboardSummary();

  res.status(200).json({
    status: "ok",
    generated_at: new Date().toISOString(),
    summary,
  });
}
