type TriggerSyncInvalidationInput = {
  entityType: string;
  entityId: string;
  sourceSystem: string;
  correlationId: string;
  payloadChecksum: string;
};

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeUrl = (value: string) => {
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const triggerSyncInvalidation = async (
  input: TriggerSyncInvalidationInput
) => {
  const endpoint = process.env.SYNC_INVALIDATION_URL;

  if (!endpoint) {
    return {
      sent: false,
      reason: "SYNC_INVALIDATION_URL is not configured",
    };
  }

  const normalizedEndpoint = normalizeUrl(endpoint);
  const timeoutMs = toNumber(process.env.SYNC_INVALIDATION_TIMEOUT_MS, 4000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normalizedEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-invalidation-secret":
          process.env.SYNC_INVALIDATION_SECRET || "",
      },
      body: JSON.stringify({
        event: "sync.product.updated",
        entity_type: input.entityType,
        entity_id: input.entityId,
        source_system: input.sourceSystem,
        correlation_id: input.correlationId,
        payload_checksum: input.payloadChecksum,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `[sync] Cache invalidation failed ${response.status} ${response.statusText}: ${body}`
      );
    }

    return {
      sent: true,
    };
  } finally {
    clearTimeout(timeout);
  }
};
