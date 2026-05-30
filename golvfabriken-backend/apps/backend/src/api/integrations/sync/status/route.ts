import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getSyncJobLockState,
  getSyncQueueDepth,
  getSyncQueuePauseState,
  getSyncQueueVisibilityTimeoutSeconds,
  inspectStaleProcessingQueueEntries,
} from "../../../../lib/sync/queue";
import { SYNC_MODULE } from "../../../../modules/sync";
import SyncModuleService from "../../../../modules/sync/service";
import { validateSyncAdminSecret } from "../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const scanLimit = Number(req.query.scan_limit || 1000);
  const staleAfterSeconds = Number(
    req.query.stale_after_seconds || getSyncQueueVisibilityTimeoutSeconds()
  );
  const staleLimit = Number(req.query.stale_limit || 25);
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const [statusCounts, queue, pause, lock, stale] = await Promise.all([
    syncService.getEventStatusCounts(
      Number.isFinite(scanLimit) && scanLimit > 0 ? scanLimit : 1000
    ),
    getSyncQueueDepth(),
    getSyncQueuePauseState(),
    getSyncJobLockState(),
    inspectStaleProcessingQueueEntries({
      staleAfterSeconds:
        Number.isFinite(staleAfterSeconds) && staleAfterSeconds > 0
          ? staleAfterSeconds
          : getSyncQueueVisibilityTimeoutSeconds(),
      limit: Number.isFinite(staleLimit) && staleLimit > 0 ? staleLimit : 25,
    }),
  ]);

  res.status(200).json({
    status: "ok",
    event_counts: statusCounts,
    queue,
    pause,
    lock,
    stale_inspection: stale,
  });
}
