import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SYNC_MODULE } from "../../../../../modules/sync";
import SyncModuleService from "../../../../../modules/sync/service";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

type ReconcileMappingsPayload = {
  limit?: number;
  mark_conflict?: boolean;
  note?: string;
};

const toPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function POST(
  req: MedusaRequest<ReconcileMappingsPayload>,
  res: MedusaResponse
) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const limit = toPositiveNumber(payload.limit, 2000);
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const result = await syncService.reconcileMappings({
    limit,
    markConflict: payload.mark_conflict !== false,
    note: payload.note,
  });

  res.status(200).json({
    status: "ok",
    reconciliation: result,
  });
}
