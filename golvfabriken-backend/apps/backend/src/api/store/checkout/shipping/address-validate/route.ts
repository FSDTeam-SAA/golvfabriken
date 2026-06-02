import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveShippingAddressValidation } from "../../../../../lib/ops/integration-runtime";

type StoreShippingAddressValidatePayload = {
  country_code?: string;
  postal_code?: string;
  city?: string;
  address_line1?: string;
  company?: string;
  recipient_name?: string;
  phone?: string;
};

export async function POST(
  req: MedusaRequest<StoreShippingAddressValidatePayload>,
  res: MedusaResponse
) {
  const payload = req.body || {};
  const result = await resolveShippingAddressValidation(payload);

  if (result.mode === "skip") {
    res.status(412).json({
      status: "skip",
      reason: result.note || result.runtime.skipReason,
      validation: result.validation,
    });
    return;
  }

  res.status(200).json({
    status: result.mode === "live" ? "live" : "fallback_preview",
    note: result.note,
    validation: result.validation,
  });
}
