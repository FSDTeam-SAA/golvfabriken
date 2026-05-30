import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type HealthCheckPayload = {
  keys?: Array<"fraktjakt" | "klarna" | "fortnox">;
};

export async function POST(
  req: MedusaRequest<HealthCheckPayload>,
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
  const result = await opsService.runIntegrationHealthCheck({
    keys: Array.isArray(payload.keys) ? payload.keys : undefined,
  });

  res.status(200).json({
    status: "ok",
    health_check: result,
  });
}
