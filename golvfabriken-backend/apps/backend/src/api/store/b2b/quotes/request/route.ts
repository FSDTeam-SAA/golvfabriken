import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

type StoreB2BQuotePayload = {
  company_id?: string;
  requested_by_user_id?: string;
  customer_email?: string;
  currency_code?: string;
  requested_total?: number;
  note?: string;
  items?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

export async function POST(
  req: MedusaRequest<StoreB2BQuotePayload>,
  res: MedusaResponse
) {
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
      metadata: {
        source: "storefront",
        ...(payload.metadata || {}),
      },
    });

    res.status(201).json({
      status: "received",
      quote_request_id: quote.id,
      reference: quote.reference,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
