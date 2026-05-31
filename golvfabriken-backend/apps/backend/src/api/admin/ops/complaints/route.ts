import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

type ComplaintPayload = {
  order_id?: string;
  customer_id?: string;
  customer_email?: string;
  summary?: string;
  description?: string;
  type?: "complaint" | "damage" | "delivery_issue" | "quality_issue" | "billing_issue" | "other";
  channel?: "storefront" | "admin" | "support";
  priority?: "low" | "medium" | "high" | "critical";
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
  const items = await opsService.getComplaintCases({
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    complaints: items,
  });
}

export async function POST(
  req: MedusaRequest<ComplaintPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

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
    channel: payload.channel,
    priority: payload.priority,
    metadata: payload.metadata,
  });

  res.status(201).json({
    status: "ok",
    complaint,
  });
}
