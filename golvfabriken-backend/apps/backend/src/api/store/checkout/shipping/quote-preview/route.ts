import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  buildShippingQuotePreview,
  getIntegrationRuntimeReport,
  isOpsIntegrationSimulationEnabled,
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
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready && !simulationEnabled) {
    res.status(412).json({
      status: "skip",
      reason: runtime.skipReason,
    });
    return;
  }

  const quotes = buildShippingQuotePreview({
    destination_country: payload.destination_country,
    postal_code: payload.postal_code,
    items: payload.items,
  }).map((quote) => {
    if (payload.currency_code) {
      return {
        ...quote,
        currency_code: String(payload.currency_code).toUpperCase(),
      };
    }

    return quote;
  });

  res.status(200).json({
    status: runtime.ready ? "live_ready_preview" : "skip_preview",
    quotes,
  });
}
