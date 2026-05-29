import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  acquireSyncJobLock,
  enqueueSyncEventId,
  isSyncJobDistributedLockEnabled,
  isSyncRedisQueueEnabled,
  releaseSyncJobLock,
} from "../lib/sync/queue";
import { processSyncEventsBatch, processSyncEventsFromQueue } from "../lib/sync/worker";
import { SYNC_MODULE } from "../modules/sync";
import SyncModuleService from "../modules/sync/service";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function processSyncEventsJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const batchSize = toNumber(process.env.SYNC_JOB_BATCH_SIZE, 25);
  const maxAttempts = toNumber(process.env.SYNC_JOB_MAX_ATTEMPTS, 5);
  const concurrency = toNumber(process.env.SYNC_JOB_CONCURRENCY, 1);
  const staleAfterSeconds = toNumber(
    process.env.SYNC_PROCESSING_STALE_AFTER_SECONDS,
    600
  );
  const recoveryLimit = toNumber(process.env.SYNC_PROCESSING_RECOVERY_LIMIT, 100);
  const useRedisQueue = isSyncRedisQueueEnabled();
  const useDistributedLock = isSyncJobDistributedLockEnabled();
  const lock = await acquireSyncJobLock();

  if (useDistributedLock && !lock) {
    logger.info("[sync-job] skipped; another worker currently holds the distributed lock.");
    return;
  }

  const syncService: SyncModuleService = container.resolve(SYNC_MODULE);
  try {
    const recovered = await syncService.recoverStuckProcessingEvents({
      staleAfterSeconds,
      limit: recoveryLimit,
      maxAttempts,
    });

    if (useRedisQueue && recovered.requeueIds.length) {
      await Promise.all(
        recovered.requeueIds.map((eventId) => enqueueSyncEventId(eventId))
      );
    }

    const result = useRedisQueue
      ? await processSyncEventsFromQueue({
          container,
          batchSize,
          maxAttempts,
          concurrency,
        })
      : await processSyncEventsBatch({
          container,
          batchSize,
          maxAttempts,
          concurrency,
        });

    if (result.selected === 0) {
      if (recovered.recovered || recovered.deadLettered) {
        logger.info(
          `[sync-job] recovered=${recovered.recovered} dead_lettered=${recovered.deadLettered} stale_after_seconds=${staleAfterSeconds}`
        );
      }
      return;
    }

    logger.info(
      `[sync-job] mode=${useRedisQueue ? "redis-queue" : "db-polling"} batch_size=${batchSize} concurrency=${concurrency} selected=${result.selected} processed=${result.processed} skipped=${result.skipped} failed=${result.failed} dead_lettered=${result.deadLettered} recovered=${recovered.recovered} stale_dead_lettered=${recovered.deadLettered}`
    );
  } finally {
    await releaseSyncJobLock(lock);
  }
}

export const config = {
  name: "sync-events-processor",
  schedule: "*/1 * * * *",
};
