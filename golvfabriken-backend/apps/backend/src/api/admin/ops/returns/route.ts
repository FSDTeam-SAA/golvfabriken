import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

type ReturnPayload = {
  order_id?: string;
  complaint_case_id?: string;
  customer_id?: string;
  customer_email?: string;
  reason?: "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
  notes?: string;
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
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const items = await opsService.getReturnRequestCases({
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    returns: items,
  });
}

export async function POST(
  req: MedusaRequest<ReturnPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

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
    metadata: payload.metadata,
  });

  res.status(201).json({
    status: "ok",
    return: returnCase,
  });
}
