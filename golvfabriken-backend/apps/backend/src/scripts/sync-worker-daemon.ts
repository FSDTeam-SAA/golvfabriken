import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import processSyncEventsJob from "../jobs/process-sync-events";

type SyncWorkerDaemonParams = {
  container: MedusaContainer;
  args?: string[];
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

const parseArgs = (args: string[] = []) => {
  const parsed = new Set(args.map((arg) => String(arg).trim().toLowerCase()));

  return {
    once:
      parsed.has("--once") || parsed.has("once") || parsed.has("--mode=once"),
  };
};

export default async function syncWorkerDaemon({
  container,
  args,
}: SyncWorkerDaemonParams) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const parsedArgs = parseArgs(args);
  const pollIntervalMs = toNumber(process.env.SYNC_DAEMON_POLL_INTERVAL_MS, 500);
  const errorSleepMs = toNumber(process.env.SYNC_DAEMON_ERROR_SLEEP_MS, 3000);
  const heartbeatIntervalMs = toNumber(
    process.env.SYNC_DAEMON_HEARTBEAT_INTERVAL_MS,
    30000
  );
  const forceContinuous = toBoolean(
    process.env.SYNC_DAEMON_FORCE_CONTINUOUS,
    true
  );
  const continuousMaxRuntimeMs = toNumber(
    process.env.SYNC_DAEMON_CONTINUOUS_MAX_RUNTIME_MS,
    55000
  );
  let keepRunning = true;
  let lastHeartbeat = Date.now();
  let loopCount = 0;

  const stop = (signal: string) => {
    if (!keepRunning) {
      return;
    }

    keepRunning = false;
    logger.info(`[sync-daemon] Received ${signal}. Stopping after current cycle...`);
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  logger.info(
    `[sync-daemon] Started (once=${parsedArgs.once}) poll_interval_ms=${pollIntervalMs} force_continuous=${forceContinuous} continuous_max_runtime_ms=${continuousMaxRuntimeMs}`
  );

  do {
    loopCount += 1;

    try {
      await processSyncEventsJob(container, {
        continuousModeEnabled: forceContinuous,
        continuousMaxRuntimeMs,
        forceRun: true,
      });
    } catch (error) {
      logger.error(
        `[sync-daemon] Cycle ${loopCount} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await sleep(errorSleepMs);
    }

    const now = Date.now();

    if (now - lastHeartbeat >= heartbeatIntervalMs) {
      lastHeartbeat = now;
      logger.info(
        `[sync-daemon] heartbeat loop_count=${loopCount} keep_running=${keepRunning}`
      );
    }

    if (!parsedArgs.once && keepRunning) {
      await sleep(pollIntervalMs);
    }
  } while (!parsedArgs.once && keepRunning);

  logger.info(`[sync-daemon] Stopped after ${loopCount} cycle(s).`);
}
