import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  acquireSyncJobLock,
  enqueueSyncEventId,
  getSyncQueueVisibilityTimeoutSeconds,
  isSyncJobDistributedLockEnabled,
  isSyncRedisQueueEnabled,
  recoverStaleProcessingQueueEntries,
  releaseSyncJobLock,
} from "../lib/sync/queue";
import { processSyncEventsBatch, processSyncEventsFromQueue } from "../lib/sync/worker";
import { SYNC_MODULE } from "../modules/sync";
import SyncModuleService from "../modules/sync/service";

type SyncCycleResult = {
  selected: number;
  processed: number;
  skipped: number;
  failed: number;
  deadLettered: number;
  recovered: number;
  staleDeadLettered: number;
  queueRecovered: number;
};

type ProcessSyncJobOverrides = {
  batchSize?: number;
  maxAttempts?: number;
  concurrency?: number;
  staleAfterSeconds?: number;
  recoveryLimit?: number;
  queueRecoveryLimit?: number;
  continuousModeEnabled?: boolean;
  continuousMaxRuntimeMs?: number;
  continuousIdleSleepMs?: number;
  continuousActiveSleepMs?: number;
  continuousMaxIdleIterations?: number;
  skipDistributedLock?: boolean;
  forceRun?: boolean;
};

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const sleep = async (ms: number) => {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
};

export default async function processSyncEventsJob(
  container: MedusaContainer,
  overrides: ProcessSyncJobOverrides = {}
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const jobDisabled = toBoolean(process.env.SYNC_JOB_DISABLED, false);

  if (jobDisabled && !overrides.forceRun) {
    logger.info("[sync-job] skipped; SYNC_JOB_DISABLED=true");
    return;
  }

  const batchSize = overrides.batchSize ?? toNumber(process.env.SYNC_JOB_BATCH_SIZE, 25);
  const maxAttempts = overrides.maxAttempts ?? toNumber(process.env.SYNC_JOB_MAX_ATTEMPTS, 5);
  const concurrency = overrides.concurrency ?? toNumber(process.env.SYNC_JOB_CONCURRENCY, 1);
  const staleAfterSeconds = overrides.staleAfterSeconds ?? toNumber(
    process.env.SYNC_PROCESSING_STALE_AFTER_SECONDS,
    600
  );
  const recoveryLimit = overrides.recoveryLimit ?? toNumber(
    process.env.SYNC_PROCESSING_RECOVERY_LIMIT,
    100
  );
  const queueVisibilityTimeoutSeconds = getSyncQueueVisibilityTimeoutSeconds();
  const queueRecoveryLimit = overrides.queueRecoveryLimit ?? toNumber(
    process.env.SYNC_QUEUE_STALE_RECOVERY_LIMIT,
    100
  );
  const continuousModeEnabled = overrides.continuousModeEnabled ?? toBoolean(
    process.env.SYNC_JOB_CONTINUOUS_ENABLED,
    false
  );
  const continuousMaxRuntimeMs = overrides.continuousMaxRuntimeMs ?? toNumber(
    process.env.SYNC_JOB_CONTINUOUS_MAX_RUNTIME_MS,
    55000
  );
  const continuousIdleSleepMs = overrides.continuousIdleSleepMs ?? toNumber(
    process.env.SYNC_JOB_CONTINUOUS_IDLE_SLEEP_MS,
    1000
  );
  const continuousActiveSleepMs = overrides.continuousActiveSleepMs ?? toNumber(
    process.env.SYNC_JOB_CONTINUOUS_ACTIVE_SLEEP_MS,
    0
  );
  const continuousMaxIdleIterations = overrides.continuousMaxIdleIterations ?? toNumber(
    process.env.SYNC_JOB_CONTINUOUS_MAX_IDLE_ITERATIONS,
    5
  );
  const useRedisQueue = isSyncRedisQueueEnabled();
  const useDistributedLock = isSyncJobDistributedLockEnabled();
  const lock = overrides.skipDistributedLock ? null : await acquireSyncJobLock();

  if (useDistributedLock && !overrides.skipDistributedLock && !lock) {
    logger.info("[sync-job] skipped; another worker currently holds the distributed lock.");
    return;
  }

  const syncService: SyncModuleService = container.resolve(SYNC_MODULE);

  const runSingleCycle = async (): Promise<SyncCycleResult> => {
    const queueRecovered = useRedisQueue
      ? await recoverStaleProcessingQueueEntries({
          staleAfterSeconds: queueVisibilityTimeoutSeconds,
          limit: queueRecoveryLimit,
        })
      : {
          enabled: false,
          scanned: 0,
          recovered: 0,
          eventIds: [] as string[],
        };

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

    return {
      selected: result.selected,
      processed: result.processed,
      skipped: result.skipped,
      failed: result.failed,
      deadLettered: result.deadLettered,
      recovered: recovered.recovered,
      staleDeadLettered: recovered.deadLettered,
      queueRecovered: queueRecovered.recovered,
    };
  };

  try {
    if (!continuousModeEnabled) {
      const cycle = await runSingleCycle();

      if (cycle.selected === 0) {
        if (cycle.recovered || cycle.staleDeadLettered || cycle.queueRecovered) {
          logger.info(
            `[sync-job] recovered=${cycle.recovered} dead_lettered=${cycle.staleDeadLettered} stale_after_seconds=${staleAfterSeconds} queue_recovered=${cycle.queueRecovered} queue_stale_after_seconds=${queueVisibilityTimeoutSeconds}`
          );
        }
        return;
      }

      logger.info(
        `[sync-job] mode=${useRedisQueue ? "redis-queue" : "db-polling"} batch_size=${batchSize} concurrency=${concurrency} selected=${cycle.selected} processed=${cycle.processed} skipped=${cycle.skipped} failed=${cycle.failed} dead_lettered=${cycle.deadLettered} recovered=${cycle.recovered} stale_dead_lettered=${cycle.staleDeadLettered} queue_recovered=${cycle.queueRecovered}`
      );
      return;
    }

    const startedAt = Date.now();
    let iterations = 0;
    let idleIterations = 0;
    const totals: SyncCycleResult = {
      selected: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      deadLettered: 0,
      recovered: 0,
      staleDeadLettered: 0,
      queueRecovered: 0,
    };

    while (Date.now() - startedAt < continuousMaxRuntimeMs) {
      const cycle = await runSingleCycle();
      iterations += 1;
      totals.selected += cycle.selected;
      totals.processed += cycle.processed;
      totals.skipped += cycle.skipped;
      totals.failed += cycle.failed;
      totals.deadLettered += cycle.deadLettered;
      totals.recovered += cycle.recovered;
      totals.staleDeadLettered += cycle.staleDeadLettered;
      totals.queueRecovered += cycle.queueRecovered;

      if (cycle.selected === 0) {
        idleIterations += 1;

        if (idleIterations >= continuousMaxIdleIterations) {
          break;
        }

        await sleep(continuousIdleSleepMs);
        continue;
      }

      idleIterations = 0;
      await sleep(continuousActiveSleepMs);
    }

    logger.info(
      `[sync-job] mode=${useRedisQueue ? "redis-queue-continuous" : "db-polling-continuous"} runtime_ms=${Date.now() - startedAt} iterations=${iterations} idle_iterations=${idleIterations} batch_size=${batchSize} concurrency=${concurrency} selected=${totals.selected} processed=${totals.processed} skipped=${totals.skipped} failed=${totals.failed} dead_lettered=${totals.deadLettered} recovered=${totals.recovered} stale_dead_lettered=${totals.staleDeadLettered} queue_recovered=${totals.queueRecovered}`
    );
  } finally {
    await releaseSyncJobLock(lock);
  }
}

export const config = {
  name: "sync-events-processor",
  schedule: "*/1 * * * *",
};
