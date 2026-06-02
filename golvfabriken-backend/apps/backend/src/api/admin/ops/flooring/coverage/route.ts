import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { calculateFlooringCoverage } from "../../../../../lib/ops/flooring-runtime";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type AdminFlooringCoveragePayload = {
  desired_m2?: number;
  length_m?: number;
  width_m?: number;
  m2_per_package?: number;
  waste_pct?: number;
};

export async function POST(
  req: MedusaRequest<AdminFlooringCoveragePayload>,
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
  const result = calculateFlooringCoverage(payload);

  if (!result.is_valid) {
    res.status(400).json({
      status: "invalid",
      result,
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    result,
  });
}
