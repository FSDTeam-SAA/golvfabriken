import crypto from "crypto";

export type SyncSourceSystem = "medusa" | "strapi" | "system";
export type SyncTargetSystem = "medusa" | "strapi" | "frontend" | "system";
export type SyncOperation =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "unknown";
export type SyncOrigin = "user" | "integration" | "system" | "scheduled_sync";

export type SyncEventStatus =
  | "received"
  | "processing"
  | "processed"
  | "failed"
  | "ignored";

export interface NormalizedSyncEvent {
  event_id: string;
  correlation_id: string;
  source_system: SyncSourceSystem;
  target_system: SyncTargetSystem;
  entity_type: string;
  entity_id: string;
  external_id?: string;
  operation: SyncOperation;
  changed_fields: string[];
  origin: SyncOrigin;
  timestamp: string;
  payload_checksum: string;
  raw_event_name?: string;
}

export interface SyncMappingRecord {
  id: string;
  entity_type: string;
  medusa_id?: string;
  strapi_document_id?: string;
  strapi_numeric_id?: string | number;
  locale?: string;
  last_synced_at?: string;
  last_source?: SyncSourceSystem;
  checksum?: string;
  sync_status: "pending" | "synced" | "failed" | "conflict";
  last_error?: string;
}

export interface SyncEventRecord extends NormalizedSyncEvent {
  status: SyncEventStatus;
  attempt_count: number;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export const createCorrelationId = () => {
  return `corr_${crypto.randomUUID()}`;
};

export const createPayloadChecksum = (payload: unknown) => {
  const serialized = JSON.stringify(payload ?? {});

  return crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex");
};

export const createDeterministicEventId = ({
  source,
  eventName,
  entityId,
  timestamp,
  checksum,
}: {
  source: SyncSourceSystem;
  eventName?: string;
  entityId?: string | number;
  timestamp?: string;
  checksum: string;
}) => {
  const sourceText = [
    source,
    eventName || "unknown",
    entityId || "unknown",
    timestamp || "unknown",
    checksum,
  ].join(":");

  return `evt_${crypto
    .createHash("sha256")
    .update(sourceText)
    .digest("hex")
    .slice(0, 32)}`;
};

export const toSyncEventRecord = (
  event: NormalizedSyncEvent
): SyncEventRecord => {
  return {
    ...event,
    status: "received",
    attempt_count: 0,
    created_at: new Date().toISOString(),
  };
};

export const getChangedFields = (
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined
) => {
  if (!after) {
    return [];
  }

  if (!before) {
    return Object.keys(after);
  }

  return Object.keys(after).filter((key) => {
    return JSON.stringify(before[key]) !== JSON.stringify(after[key]);
  });
};

export const shouldIgnoreSyncEcho = ({
  syncOrigin,
  sourceSystem,
}: {
  syncOrigin?: string;
  sourceSystem: SyncSourceSystem;
}) => {
  const normalizedOrigin = String(syncOrigin || "")
    .trim()
    .toLowerCase();

  if (!normalizedOrigin) {
    return false;
  }

  if (normalizedOrigin === sourceSystem) {
    return true;
  }

  if (
    normalizedOrigin === "integration-service" ||
    normalizedOrigin === "integration" ||
    normalizedOrigin === "system" ||
    normalizedOrigin === "scheduled_sync"
  ) {
    return true;
  }

  if (
    sourceSystem === "strapi" &&
    (normalizedOrigin === "medusa" || normalizedOrigin.startsWith("medusa-"))
  ) {
    return true;
  }

  if (
    sourceSystem === "medusa" &&
    (normalizedOrigin === "strapi" || normalizedOrigin.startsWith("strapi-"))
  ) {
    return true;
  }

  return false;
};
