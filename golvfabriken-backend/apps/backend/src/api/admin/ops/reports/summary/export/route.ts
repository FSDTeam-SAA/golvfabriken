import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { buildOpsSummaryCsv } from "../../../../../../lib/ops/reports";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const summary = await opsService.getOpsDashboardSummary();
  const csv = buildOpsSummaryCsv(summary);
  const fileName = `ops-summary-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(csv);
}
