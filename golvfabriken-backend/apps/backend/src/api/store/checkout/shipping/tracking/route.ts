import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveShippingTracking } from "../../../../../lib/ops/integration-runtime";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const shipmentId = String(req.query.shipment_id || "").trim();

  if (!shipmentId) {
    res.status(400).json({
      message: "shipment_id is required",
    });
    return;
  }

  const result = await resolveShippingTracking(shipmentId);

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
    tracking: result.tracking,
  });
}
