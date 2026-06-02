import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

type StoreB2BApprovalSubmitPayload = {
  company_id?: string;
  order_id?: string;
  requested_by_user_id?: string;
  amount_total?: number;
  currency_code?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(
  req: MedusaRequest<StoreB2BApprovalSubmitPayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};

  if (!payload.company_id || !payload.order_id) {
    res.status(400).json({
      message: "company_id and order_id are required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const approval = await opsService.createB2BOrderApproval({
      companyId: payload.company_id,
      orderId: payload.order_id,
      requestedByUserId: payload.requested_by_user_id,
      amountTotal: Number(payload.amount_total || 0),
      currencyCode: payload.currency_code,
      metadata: {
        source: "storefront",
        ...(payload.metadata || {}),
      },
    });

    res.status(201).json({
      status: "ok",
      approval_id: approval.id,
      approval_status: approval.status,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
