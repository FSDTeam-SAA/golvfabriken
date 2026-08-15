import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveKlarnaCapture } from "../../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type KlarnaCapturePayload = {
  order_id?: string;
  captured_amount?: number;
  description?: string;
  order_lines?: Array<Record<string, unknown>>;
};

export async function POST(
  req: MedusaRequest<KlarnaCapturePayload>,
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
  const orderId = String(payload.order_id || "").trim();

  if (!orderId) {
    res.status(400).json({
      message: "order_id is required",
    });
    return;
  }

  const result = await resolveKlarnaCapture({
    order_id: orderId,
    captured_amount: payload.captured_amount,
    description: payload.description,
    order_lines: payload.order_lines,
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
    capture: result.capture,
  });
}
