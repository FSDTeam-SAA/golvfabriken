import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type CreateFortnoxExportPayload = {
  export_type?: "orders" | "returns" | "settlements";
  period_from?: string;
  period_to?: string;
  requested_by?: string;
  trigger?: "manual" | "scheduled";
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const status = req.query.status ? String(req.query.status) : undefined;
  const exports = await opsService.getFortnoxExportJobs({
    limit,
    status: status as any,
  });

  res.status(200).json({
    status: "ok",
    count: exports.length,
    exports,
  });
}

export async function POST(
  req: MedusaRequest<CreateFortnoxExportPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const result = await opsService.createFortnoxExportJob({
    exportType: payload.export_type,
    periodFrom: payload.period_from,
    periodTo: payload.period_to,
    requestedBy: payload.requested_by,
    trigger: payload.trigger,
  });

  res.status(201).json({
    status: "ok",
    export: result,
  });
}
