import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  resolveShippingQuote,
  type ShippingQuotePreviewInput,
} from "../../../../../lib/ops/integration-runtime";

type StoreShippingQuotePayload = ShippingQuotePreviewInput & {
  currency_code?: string;
};

export async function POST(
  req: MedusaRequest<StoreShippingQuotePayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};
  const result = await resolveShippingQuote({
    destination_country: payload.destination_country,
    postal_code: payload.postal_code,
    items: payload.items,
    currency_code: payload.currency_code,
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
    quotes: result.quotes,
  });
}
