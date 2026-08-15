import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveShippingLabel } from "../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type ShippingLabelPayload = {
  shipment_id?: string;
};

export async function POST(req: MedusaRequest<ShippingLabelPayload>, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const shipmentId = String(payload.shipment_id || "").trim();

  if (!shipmentId) {
    res.status(400).json({
      message: "shipment_id is required",
    });
    return;
  }

  const result = await resolveShippingLabel(shipmentId);

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
    label: result.label,
  });
}
