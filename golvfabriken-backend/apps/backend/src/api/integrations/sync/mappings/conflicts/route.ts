import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SYNC_MODULE } from "../../../../../modules/sync";
import SyncModuleService from "../../../../../modules/sync/service";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

const toPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const limit = toPositiveNumber(req.query.limit, 100);
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const conflicts = await syncService.listMappingsByStatus({
    status: "conflict",
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: conflicts.length,
    mappings: conflicts,
  });
}
