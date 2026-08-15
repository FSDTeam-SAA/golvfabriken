import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveShippingAddressValidation } from "../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type ShippingAddressValidatePayload = {
  country_code?: string;
  postal_code?: string;
  city?: string;
  address_line1?: string;
  company?: string;
  recipient_name?: string;
  phone?: string;
};

export async function POST(
  req: MedusaRequest<ShippingAddressValidatePayload>,
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
  const result = await resolveShippingAddressValidation(payload);

  if (result.mode === "skip") {
    res.status(412).json({
      status: "skip",
      reason: result.note || result.runtime.skipReason,
      missing_keys: result.runtime.missingKeys,
      runtime: result.runtime,
      validation: result.validation,
    });
    return;
  }

  res.status(200).json({
    status: result.mode === "live" ? "live" : "fallback_preview",
    runtime: result.runtime,
    note: result.note,
    validation: result.validation,
  });
}
