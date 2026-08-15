import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type SetIntegrationStatusPayload = {
  key?: string;
  status?: "planned" | "active" | "paused" | "error" | "skipped";
  skip_reason?: string;
  last_error?: string;
  base_url?: string;
  last_health_check_at?: string;
};

const allowedStatuses = new Set(["planned", "active", "paused", "error", "skipped"]);

export async function POST(
  req: MedusaRequest<SetIntegrationStatusPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const key = String(payload.key || "").trim();
  const status = String(payload.status || "").trim();

  if (!key) {
    res.status(400).json({ message: "key is required" });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({ message: "invalid status" });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const integration = await opsService.setIntegrationConnectorStatus({
    key,
    status: status as any,
    skipReason: payload.skip_reason,
    lastError: payload.last_error,
    baseUrl: payload.base_url,
    lastHealthCheckAt: payload.last_health_check_at,
  });

  res.status(200).json({
    status: "ok",
    integration,
  });
}
