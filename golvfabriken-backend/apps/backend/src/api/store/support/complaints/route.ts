import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";

type StoreComplaintPayload = {
  order_id?: string;
  customer_id?: string;
  customer_email?: string;
  summary?: string;
  description?: string;
  type?: "complaint" | "damage" | "delivery_issue" | "quality_issue" | "billing_issue" | "other";
};

export async function POST(
  req: MedusaRequest<StoreComplaintPayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};

  if (!payload.summary) {
    res.status(400).json({
      message: "summary is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const complaint = await opsService.createComplaintCase({
    orderId: payload.order_id,
    customerId: payload.customer_id,
    customerEmail: payload.customer_email,
    summary: payload.summary,
    description: payload.description,
    type: payload.type,
    channel: "storefront",
    priority: "medium",
  });

  res.status(201).json({
    status: "received",
    complaint_id: complaint.id,
    reference: complaint.reference,
  });
}
