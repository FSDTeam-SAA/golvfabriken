import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type PrivacyAnonymizePayload = {
  id?: string;
  dry_run?: boolean;
};

export async function POST(
  req: MedusaRequest<PrivacyAnonymizePayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};
  const id = String(payload.id || "").trim();

  if (!id) {
    res.status(400).json({ message: "id is required" });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const result = await opsService.runPrivacyAnonymize({
      id,
      dryRun: payload.dry_run !== false,
    });

    res.status(200).json({
      status: "ok",
      privacy_anonymize: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
