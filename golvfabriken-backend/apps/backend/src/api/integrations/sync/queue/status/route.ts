import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getSyncJobLockState,
  getSyncQueueDepth,
  getSyncQueuePauseState,
  getSyncQueueVisibilityTimeoutSeconds,
  inspectStaleProcessingQueueEntries,
} from "../../../../../lib/sync/queue";
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

  const staleAfterSeconds = toPositiveNumber(
    req.query.stale_after_seconds,
    getSyncQueueVisibilityTimeoutSeconds()
  );
  const staleLimit = toPositiveNumber(req.query.stale_limit, 25);
  const [depth, pause, lock, stale] = await Promise.all([
    getSyncQueueDepth(),
    getSyncQueuePauseState(),
    getSyncJobLockState(),
    inspectStaleProcessingQueueEntries({
      staleAfterSeconds,
      limit: staleLimit,
    }),
  ]);

  res.status(200).json({
    status: "ok",
    queue: depth,
    pause,
    lock,
    stale_inspection: stale,
    controls: {
      stale_after_seconds: staleAfterSeconds,
      stale_limit: staleLimit,
    },
  });
}
