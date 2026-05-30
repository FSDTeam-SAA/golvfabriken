import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reference = String(req.query.reference || "").trim();
  const customerEmail = req.query.customer_email
    ? String(req.query.customer_email).trim()
    : undefined;

  if (!reference) {
    res.status(400).json({
      message: "reference is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const complaint = await opsService.getStoreComplaintByReference({
    reference,
    customerEmail,
  });

  if (!complaint) {
    res.status(404).json({
      status: "not_found",
      message: "Complaint not found",
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    complaint: {
      id: complaint.id,
      reference: complaint.reference,
      order_id: complaint.order_id,
      status: complaint.status,
      type: complaint.type,
      summary: complaint.summary,
      resolution: complaint.resolution,
      created_at: complaint.created_at,
      resolved_at: complaint.resolved_at,
    },
  });
}
