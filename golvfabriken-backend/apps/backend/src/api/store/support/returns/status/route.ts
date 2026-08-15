import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.query.id || "").trim();
  const customerEmail = req.query.customer_email
    ? String(req.query.customer_email).trim()
    : undefined;

  if (!id) {
    res.status(400).json({
      message: "id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const returnCase = await opsService.getStoreReturnById({
    id,
    customerEmail,
  });

  if (!returnCase) {
    res.status(404).json({
      status: "not_found",
      message: "Return request not found",
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    return_request: {
      id: returnCase.id,
      order_id: returnCase.order_id,
      status: returnCase.status,
      reason: returnCase.reason,
      notes: returnCase.notes,
      requested_at: returnCase.requested_at,
      approved_at: returnCase.approved_at,
      rejected_at: returnCase.rejected_at,
      received_at: returnCase.received_at,
      refunded_at: returnCase.refunded_at,
    },
  });
}
