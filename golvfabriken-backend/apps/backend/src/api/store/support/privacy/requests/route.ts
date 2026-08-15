import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

type StorePrivacyRequestPayload = {
  request_type?: "data_export" | "anonymize" | "erasure";
  customer_id?: string;
  customer_email?: string;
  notes?: string;
};

export async function POST(
  req: MedusaRequest<StorePrivacyRequestPayload>,
  res: MedusaResponse
) {
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
    requestedBy: payload.customer_id || payload.customer_email,
    notes: payload.notes,
    metadata: {
      source: "storefront",
    },
  });

  res.status(201).json({
    status: "received",
    privacy_request_id: request.id,
  });
}
