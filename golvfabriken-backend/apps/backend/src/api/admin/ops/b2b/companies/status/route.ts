import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type B2BCompanyStatusPayload = {
  id?: string;
  status?: "pending" | "active" | "suspended" | "rejected";
  metadata?: Record<string, unknown>;
};

const allowedStatuses = new Set(["pending", "active", "suspended", "rejected"]);

export async function POST(
  req: MedusaRequest<B2BCompanyStatusPayload>,
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

  try {
    const company = await opsService.updateB2BCompanyStatus({
      id,
      status: status as any,
      metadata: payload.metadata,
    });

    res.status(200).json({
      status: "ok",
      company,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
