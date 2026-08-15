import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  resolveShippingBooking,
  type ShippingBookingInput,
} from "../../../../../lib/ops/integration-runtime";

type StoreShippingBookingPayload = ShippingBookingInput;

export async function POST(
  req: MedusaRequest<StoreShippingBookingPayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};
  const orderReference = String(payload.order_reference || "").trim();

  if (!orderReference) {
    res.status(400).json({
      message: "order_reference is required",
    });
    return;
  }

  const result = await resolveShippingBooking({
    ...payload,
    order_reference: orderReference,
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
    booking: result.booking,
  });
}
