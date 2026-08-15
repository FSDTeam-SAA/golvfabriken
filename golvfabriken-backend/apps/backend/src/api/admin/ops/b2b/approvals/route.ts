import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type B2BApprovalPayload = {
  company_id?: string;
  order_id?: string;
  requested_by_user_id?: string;
  approver_user_id?: string;
  amount_total?: number;
  currency_code?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const companyId = req.query.company_id ? String(req.query.company_id) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getB2BOrderApprovals({
    companyId,
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    approvals: items,
  });
}

export async function POST(
  req: MedusaRequest<B2BApprovalPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

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
      approverUserId: payload.approver_user_id,
      amountTotal: Number(payload.amount_total || 0),
      currencyCode: payload.currency_code,
      metadata: payload.metadata,
    });

    res.status(201).json({
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
