import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type PrivacyRequestPayload = {
  request_type?: "data_export" | "anonymize" | "erasure";
  customer_id?: string;
  customer_email?: string;
  requested_by?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const status = req.query.status ? String(req.query.status) : undefined;
  const requestType = req.query.request_type ? String(req.query.request_type) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getPrivacyRequests({
    status: status as any,
    requestType: requestType as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    privacy_requests: items,
  });
}

export async function POST(
  req: MedusaRequest<PrivacyRequestPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};

  if (!payload.customer_email && !payload.customer_id) {
    res.status(400).json({
      message: "customer_email or customer_id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const request = await opsService.createPrivacyRequest({
    requestType: payload.request_type,
    customerId: payload.customer_id,
    customerEmail: payload.customer_email,
    requestedBy: payload.requested_by,
    notes: payload.notes,
    metadata: payload.metadata,
  });

  res.status(201).json({
    status: "ok",
    privacy_request: request,
  });
}
