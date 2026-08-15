import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type UpdateReturnStatusPayload = {
  id?: string;
  status?: "requested" | "approved" | "rejected" | "received" | "refunded" | "closed";
  notes?: string;
};

const allowedStatuses = new Set([
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
  "closed",
]);

export async function POST(
  req: MedusaRequest<UpdateReturnStatusPayload>,
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
    const returnCase = await opsService.updateReturnRequestCaseStatus({
      id,
      status: status as any,
      notes: payload.notes,
    });

    res.status(200).json({
      status: "ok",
      return: returnCase,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
