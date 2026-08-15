import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SYNC_MODULE } from "../modules/sync";
import SyncModuleService from "../modules/sync/service";

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

export default async function reconcileSyncMappingsJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const enabled = toBoolean(process.env.SYNC_RECONCILE_JOB_ENABLED, false);

  if (!enabled) {
    return;
  }

  const limit = toNumber(process.env.SYNC_RECONCILE_SCAN_LIMIT, 2000);
  const markConflict = toBoolean(process.env.SYNC_RECONCILE_MARK_CONFLICT, true);
  const syncService: SyncModuleService = container.resolve(SYNC_MODULE);
  const result = await syncService.reconcileMappings({
    limit,
    markConflict,
    note: "[RECONCILE_JOB] Conflict detected by scheduled reconciliation",
  });

  if (!result.conflictCount) {
    return;
  }

  logger.warn(
    `[sync-reconcile-job] scanned=${result.scanned} conflicts=${result.conflictCount} invalid=${result.invalidCount} duplicate_medusa_keys=${result.duplicateMedusaKeyCount} duplicate_strapi_keys=${result.duplicateStrapiKeyCount}`
  );
}

export const config = {
  name: "sync-mapping-reconcile",
  schedule: "*/10 * * * *",
};
