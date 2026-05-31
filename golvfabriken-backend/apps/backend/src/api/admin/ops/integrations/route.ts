import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

type RegisterIntegrationPayload = {
  key?: string;
  display_name?: string;
  category?: "shipping" | "payment" | "accounting" | "erp" | "cms" | "analytics" | "other";
  status?: "planned" | "active" | "paused" | "error" | "skipped";
  skip_reason?: string;
  base_url?: string;
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
  const category = req.query.category ? String(req.query.category) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const items = await opsService.getIntegrationConnectors({
    status: status as any,
    category: category as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    integrations: items,
  });
}

export async function POST(
  req: MedusaRequest<RegisterIntegrationPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const key = String(payload.key || "").trim();
  const displayName = String(payload.display_name || "").trim();

  if (!key || !displayName) {
    res.status(400).json({
      message: "key and display_name are required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const integration = await opsService.registerIntegrationConnector({
    key,
    displayName,
    category: payload.category,
    status: payload.status,
    skipReason: payload.skip_reason,
    baseUrl: payload.base_url,
    metadata: payload.metadata,
  });

  res.status(201).json({
    status: "ok",
    integration,
  });
}
