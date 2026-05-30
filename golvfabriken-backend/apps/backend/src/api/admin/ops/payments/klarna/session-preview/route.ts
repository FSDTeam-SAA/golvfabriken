import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  buildKlarnaSessionPreview,
  getIntegrationRuntimeReport,
  isOpsIntegrationSimulationEnabled,
} from "../../../../../../lib/ops/integration-runtime";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type KlarnaSessionPreviewPayload = {
  amount?: number;
  currency_code?: string;
  locale?: string;
  order_reference?: string;
};

export async function POST(
  req: MedusaRequest<KlarnaSessionPreviewPayload>,
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
  const amount = Number(payload.amount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({
      message: "amount must be a positive number",
    });
    return;
  }

  const runtime = getIntegrationRuntimeReport("klarna");
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready && !simulationEnabled) {
    res.status(412).json({
      status: "skip",
      reason: runtime.skipReason,
      missing_keys: runtime.missingKeys,
    });
    return;
  }

  const session = buildKlarnaSessionPreview({
    amount,
    currency_code: payload.currency_code,
    locale: payload.locale,
    order_reference: payload.order_reference,
  });

  res.status(200).json({
    status: runtime.ready ? "live_ready_preview" : "skip_preview",
    runtime,
    session,
  });
}
