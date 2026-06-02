import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type B2BQuotePayload = {
  company_id?: string;
  requested_by_user_id?: string;
  customer_email?: string;
  currency_code?: string;
  requested_total?: number;
  note?: string;
  items?: Array<Record<string, unknown>>;
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
  const items = await opsService.getB2BQuoteRequests({
    companyId,
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    quotes: items,
  });
}

export async function POST(req: MedusaRequest<B2BQuotePayload>, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};

  if (!payload.company_id) {
    res.status(400).json({
      message: "company_id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const quote = await opsService.createB2BQuoteRequest({
      companyId: payload.company_id,
      requestedByUserId: payload.requested_by_user_id,
      customerEmail: payload.customer_email,
      currencyCode: payload.currency_code,
      requestedTotal: payload.requested_total,
      note: payload.note,
      items: payload.items,
      metadata: payload.metadata,
    });

    res.status(201).json({
      status: "ok",
      quote,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
