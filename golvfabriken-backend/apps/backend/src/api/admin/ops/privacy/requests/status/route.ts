import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type PrivacyStatusPayload = {
  id?: string;
  status?: "requested" | "in_progress" | "completed" | "rejected" | "skipped";
  result_summary?: string;
  payload?: Record<string, unknown>;
};

const allowedStatuses = new Set([
  "requested",
  "in_progress",
  "completed",
  "rejected",
  "skipped",
]);

export async function POST(
  req: MedusaRequest<PrivacyStatusPayload>,
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
    const request = await opsService.updatePrivacyRequestStatus({
      id,
      status: status as any,
      resultSummary: payload.result_summary,
      payload: payload.payload,
    });

    res.status(200).json({
      status: "ok",
      privacy_request: request,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
