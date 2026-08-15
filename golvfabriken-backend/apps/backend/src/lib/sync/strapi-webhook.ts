import {
  NormalizedSyncEvent,
  SyncOperation,
  createCorrelationId,
  createDeterministicEventId,
  createPayloadChecksum,
  getChangedFields,
  shouldIgnoreSyncEcho,
} from "./events";

export type StrapiWebhookPayload = {
  event?: string;
  createdAt?: string;
  model?: string;
  uid?: string;
  entry?: Record<string, any>;
  before?: Record<string, any>;
  after?: Record<string, any>;
  [key: string]: any;
};

export type StrapiWebhookHeaders = Record<string, string | string[] | undefined>;

export interface StrapiWebhookValidationResult {
  valid: boolean;
  reason?: string;
}

const STRAPI_SECRET_HEADERS = [
  "x-strapi-webhook-secret",
  "x-strapi-secret",
  "x-webhook-secret",
];

const getHeader = (
  headers: StrapiWebhookHeaders,
  headerName: string
) => {
  const value = headers[headerName] || headers[headerName.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
};

export const validateStrapiWebhookSecret = (
  headers: StrapiWebhookHeaders,
  expectedSecret?: string
): StrapiWebhookValidationResult => {
  if (!expectedSecret) {
    return {
      valid: false,
      reason: "STRAPI_WEBHOOK_SECRET is not configured",
    };
  }

  const receivedSecret = STRAPI_SECRET_HEADERS
    .map((header) => getHeader(headers, header))
    .find(Boolean);

  if (!receivedSecret) {
    return {
      valid: false,
      reason: "Missing Strapi webhook secret header",
    };
  }

  if (receivedSecret !== expectedSecret) {
    return {
      valid: false,
      reason: "Invalid Strapi webhook secret",
    };
  }

  return { valid: true };
};

const normalizeOperation = (eventName?: string): SyncOperation => {
  const normalized = eventName?.toLowerCase() || "";

  if (normalized.includes("publish")) {
    return normalized.includes("unpublish") ? "unpublish" : "publish";
  }

  if (normalized.includes("delete")) {
    return "delete";
  }

  if (normalized.includes("create")) {
    return "create";
  }

  if (normalized.includes("update")) {
    return "update";
  }

  return "unknown";
};

const normalizeEntityType = (payload: StrapiWebhookPayload) => {
  const rawType = payload.model || payload.uid || "unknown";

  if (rawType.includes("product-enrichment")) {
    return "product";
  }

  return rawType;
};

const getEntry = (payload: StrapiWebhookPayload) => {
  return payload.entry || payload.after || payload.data || {};
};

const getEntityId = (entry: Record<string, any>) => {
  return String(
    entry.medusa_id ||
      entry.medusaId ||
      entry.documentId ||
      entry.document_id ||
      entry.id ||
      "unknown"
  );
};

const getExternalId = (entry: Record<string, any>) => {
  const externalId = entry.documentId || entry.document_id || entry.id;

  return externalId == null ? undefined : String(externalId);
};

export const normalizeStrapiWebhookEvent = ({
  payload,
  eventId,
  correlationId,
}: {
  payload: StrapiWebhookPayload;
  eventId?: string;
  correlationId?: string;
}): NormalizedSyncEvent => {
  const entry = getEntry(payload);
  const timestamp = payload.createdAt || new Date().toISOString();
  const checksum = createPayloadChecksum(payload);
  const entityId = getEntityId(entry);

  return {
    event_id: eventId || createDeterministicEventId({
      source: "strapi",
      eventName: payload.event,
      entityId,
      timestamp,
      checksum,
    }),
    correlation_id: correlationId || entry.sync_correlation_id || createCorrelationId(),
    source_system: "strapi",
    target_system: "medusa",
    entity_type: normalizeEntityType(payload),
    entity_id: entityId,
    external_id: getExternalId(entry),
    operation: normalizeOperation(payload.event),
    changed_fields: getChangedFields(payload.before, entry),
    origin: entry.sync_origin ? "integration" : "user",
    timestamp,
    payload_checksum: checksum,
    raw_event_name: payload.event,
  };
};

export const shouldIgnoreStrapiWebhook = (payload: StrapiWebhookPayload) => {
  const entry = getEntry(payload);

  return shouldIgnoreSyncEcho({
    syncOrigin: entry.sync_origin || entry.syncOrigin,
    sourceSystem: "strapi",
  });
};
