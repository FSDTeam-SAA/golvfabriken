import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";

type StoreReturnPayload = {
  order_id?: string;
  complaint_case_id?: string;
  customer_id?: string;
  customer_email?: string;
  reason?: "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
  notes?: string;
};

export async function POST(
  req: MedusaRequest<StoreReturnPayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};

  if (!payload.order_id) {
    res.status(400).json({
      message: "order_id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const returnCase = await opsService.createReturnRequestCase({
    orderId: payload.order_id,
    complaintCaseId: payload.complaint_case_id,
    customerId: payload.customer_id,
    customerEmail: payload.customer_email,
    reason: payload.reason,
    notes: payload.notes,
  });

  res.status(201).json({
    status: "received",
    return_request_id: returnCase.id,
  });
}
