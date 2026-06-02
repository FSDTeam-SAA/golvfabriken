import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveKlarnaCreateOrder } from "../../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type KlarnaCreateOrderPayload = {
  authorization_token?: string;
  order_reference?: string;
  amount?: number;
  currency_code?: string;
  purchase_country?: string;
  locale?: string;
};

export async function POST(
  req: MedusaRequest<KlarnaCreateOrderPayload>,
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
  const authorizationToken = String(payload.authorization_token || "").trim();
  const amount = Number(payload.amount || 0);

  if (!authorizationToken) {
    res.status(400).json({
      message: "authorization_token is required",
    });
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({
      message: "amount must be a positive number",
    });
    return;
  }

  const result = await resolveKlarnaCreateOrder({
    authorization_token: authorizationToken,
    order_reference: payload.order_reference,
    amount,
    currency_code: payload.currency_code,
    purchase_country: payload.purchase_country,
    locale: payload.locale,
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
    order: result.order,
  });
}
