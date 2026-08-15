import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  resolveKlarnaSession,
} from "../../../../../../lib/ops/integration-runtime";

type StoreKlarnaPreviewPayload = {
  amount?: number;
  currency_code?: string;
  locale?: string;
  order_reference?: string;
};

export async function POST(
  req: MedusaRequest<StoreKlarnaPreviewPayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};
  const amount = Number(payload.amount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({
      message: "amount must be a positive number",
    });
    return;
  }

  const result = await resolveKlarnaSession({
    amount,
    currency_code: payload.currency_code,
    locale: payload.locale,
    order_reference: payload.order_reference,
  });

  if (result.mode === "skip") {
    res.status(412).json({
      status: "skip",
      reason: result.note || result.runtime.skipReason,
    });
    return;
  }

  res.status(200).json({
    status: result.mode === "live" ? "live" : "fallback_preview",
    note: result.note,
    session: result.session,
  });
}
