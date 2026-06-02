import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type B2BQuoteStatusPayload = {
  id?: string;
  status?: "requested" | "under_review" | "quoted" | "accepted" | "rejected" | "expired";
  quoted_total?: number;
  valid_until?: string;
  note?: string;
};

const allowedStatuses = new Set([
  "requested",
  "under_review",
  "quoted",
  "accepted",
  "rejected",
  "expired",
]);

export async function POST(
  req: MedusaRequest<B2BQuoteStatusPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const id = String(payload.id || "").trim();
  const status = String(payload.status || "").trim();

  if (!id) {
    res.status(400).json({ message: "id is required" });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({ message: "invalid status" });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const quote = await opsService.updateB2BQuoteStatus({
      id,
      status: status as any,
      quotedTotal: payload.quoted_total,
      validUntil: payload.valid_until,
      note: payload.note,
    });

    res.status(200).json({
      status: "ok",
      quote,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
