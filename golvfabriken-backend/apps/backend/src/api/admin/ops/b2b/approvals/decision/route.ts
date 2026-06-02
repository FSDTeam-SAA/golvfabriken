import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type B2BApprovalDecisionPayload = {
  id?: string;
  status?: "approved" | "rejected" | "cancelled";
  approver_user_id?: string;
  decision_note?: string;
};

const allowedStatuses = new Set(["approved", "rejected", "cancelled"]);

export async function POST(
  req: MedusaRequest<B2BApprovalDecisionPayload>,
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
    const approval = await opsService.decideB2BOrderApproval({
      id,
      status: status as any,
      approverUserId: payload.approver_user_id,
      decisionNote: payload.decision_note,
    });

    res.status(200).json({
      status: "ok",
      approval,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
