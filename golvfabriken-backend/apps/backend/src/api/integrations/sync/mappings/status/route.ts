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

  const scanLimit = toPositiveNumber(req.query.scan_limit, 1000);
  const conflictSampleLimit = toPositiveNumber(req.query.conflict_limit, 50);
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const [counts, conflicts] = await Promise.all([
    syncService.getMappingStatusCounts(scanLimit),
    syncService.listMappingsByStatus({
      status: "conflict",
      limit: conflictSampleLimit,
    }),
  ]);

  res.status(200).json({
    status: "ok",
    mapping_counts: counts,
    conflict_sample_count: conflicts.length,
    conflict_sample: conflicts,
  });
}
