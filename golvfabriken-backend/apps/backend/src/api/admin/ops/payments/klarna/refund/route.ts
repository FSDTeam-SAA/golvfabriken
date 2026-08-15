import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveKlarnaRefund } from "../../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type KlarnaRefundPayload = {
  order_id?: string;
  refunded_amount?: number;
  description?: string;
};

export async function POST(req: MedusaRequest<KlarnaRefundPayload>, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const orderId = String(payload.order_id || "").trim();
  const refundedAmount = Number(payload.refunded_amount || 0);

  if (!orderId) {
    res.status(400).json({
      message: "order_id is required",
    });
    return;
  }

  if (!Number.isFinite(refundedAmount) || refundedAmount <= 0) {
    res.status(400).json({
      message: "refunded_amount must be a positive number",
    });
    return;
  }

  const result = await resolveKlarnaRefund({
    order_id: orderId,
    refunded_amount: refundedAmount,
    description: payload.description,
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
    refund: result.refund,
  });
}
