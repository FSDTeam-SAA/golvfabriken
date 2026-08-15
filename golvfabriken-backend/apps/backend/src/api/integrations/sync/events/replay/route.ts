import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SYNC_MODULE } from "../../../../../modules/sync";
import SyncModuleService from "../../../../../modules/sync/service";
import { enqueueSyncEventId } from "../../../../../lib/sync/queue";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

type ReplaySyncEventsPayload = {
  ids?: string[];
  limit?: number;
  include_dead_lettered?: boolean;
  reset_attempts?: boolean;
};

export async function POST(
  req: MedusaRequest<ReplaySyncEventsPayload>,
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
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const result = await syncService.requeueFailedEvents({
    ids: payload.ids,
    limit: payload.limit,
    includeDeadLettered: payload.include_dead_lettered ?? true,
    resetAttempts: payload.reset_attempts ?? false,
  });

  const enqueueResults = await Promise.all(
    result.ids.map((eventId) => enqueueSyncEventId(eventId))
  );
  const enqueued = enqueueResults.filter((item) => item.ok).length;
  const queueSkipped = enqueueResults.length - enqueued;

  res.status(200).json({
    status: "ok",
    replay: result,
    queue: {
      enqueued,
      skipped: queueSkipped,
    },
  });
}
