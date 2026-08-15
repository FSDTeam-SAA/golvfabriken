import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  resolveShippingBooking,
  type ShippingBookingInput,
} from "../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type ShippingBookingPayload = ShippingBookingInput;

export async function POST(
  req: MedusaRequest<ShippingBookingPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

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
      missing_keys: result.runtime.missingKeys,
      runtime: result.runtime,
    });
    return;
  }

  res.status(200).json({
    status: result.mode === "live" ? "live" : "fallback_preview",
    runtime: result.runtime,
    note: result.note,
    booking: result.booking,
  });
}
