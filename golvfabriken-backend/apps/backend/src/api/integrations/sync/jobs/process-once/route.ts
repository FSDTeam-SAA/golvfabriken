import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import processSyncEventsJob from "../../../../../jobs/process-sync-events";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

type ProcessOncePayload = {
  batch_size?: number;
  max_attempts?: number;
  concurrency?: number;
  stale_after_seconds?: number;
  recovery_limit?: number;
  queue_recovery_limit?: number;
  continuous_mode_enabled?: boolean;
  continuous_max_runtime_ms?: number;
  continuous_idle_sleep_ms?: number;
  continuous_active_sleep_ms?: number;
  continuous_max_idle_iterations?: number;
  skip_distributed_lock?: boolean;
};

const toOptionalPositiveNumber = (value: unknown) => {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export async function POST(
  req: MedusaRequest<ProcessOncePayload>,
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

  await processSyncEventsJob(req.scope as any, {
    batchSize: toOptionalPositiveNumber(payload.batch_size),
    maxAttempts: toOptionalPositiveNumber(payload.max_attempts),
    concurrency: toOptionalPositiveNumber(payload.concurrency),
    staleAfterSeconds: toOptionalPositiveNumber(payload.stale_after_seconds),
    recoveryLimit: toOptionalPositiveNumber(payload.recovery_limit),
    queueRecoveryLimit: toOptionalPositiveNumber(payload.queue_recovery_limit),
    continuousModeEnabled: payload.continuous_mode_enabled ?? false,
    continuousMaxRuntimeMs: toOptionalPositiveNumber(
      payload.continuous_max_runtime_ms
    ),
    continuousIdleSleepMs: toOptionalPositiveNumber(
      payload.continuous_idle_sleep_ms
    ),
    continuousActiveSleepMs: toOptionalPositiveNumber(
      payload.continuous_active_sleep_ms
    ),
    continuousMaxIdleIterations: toOptionalPositiveNumber(
      payload.continuous_max_idle_iterations
    ),
    skipDistributedLock: payload.skip_distributed_lock ?? false,
    forceRun: true,
  });

  res.status(200).json({
    status: "ok",
    executed: true,
    mode: payload.continuous_mode_enabled ? "continuous" : "single-cycle",
  });
}
