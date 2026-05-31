import { MedusaService } from "@medusajs/framework/utils";
import {
  NormalizedSyncEvent,
  SyncEventStatus,
  SyncSourceSystem,
} from "../../lib/sync/events";
import SyncEvent from "./models/sync-event";
import SyncMapping from "./models/sync-mapping";

type GeneratedSyncModuleService = {
  listSyncEvents: (filters?: any, config?: any) => Promise<any[]>;
  createSyncEvents: (data: any) => Promise<any>;
  updateSyncEvents: (data: any) => Promise<any[]>;
  listSyncMappings: (filters?: any, config?: any) => Promise<any[]>;
  createSyncMappings: (data: any) => Promise<any>;
  updateSyncMappings: (data: any) => Promise<any[]>;
};

export type RecordSyncEventInput = {
  event: NormalizedSyncEvent;
  status?: SyncEventStatus;
  rawPayload?: Record<string, unknown>;
  processedAt?: Date | string | null;
  errorMessage?: string;
};

export type RecordSyncEventResult = {
  event: any;
  mapping?: any;
  duplicate: boolean;
};

export type UpsertSyncMappingInput = {
  entityType: string;
  medusaId?: string;
  strapiDocumentId?: string;
  strapiNumericId?: string;
  locale?: string;
  lastSource?: SyncSourceSystem;
  checksum?: string;
  syncStatus?: "pending" | "synced" | "failed" | "conflict";
  lastError?: string | null;
};

export type RequeueFailedEventsInput = {
  ids?: string[];
  limit?: number;
  includeDeadLettered?: boolean;
  resetAttempts?: boolean;
};

export type RequeueFailedEventsResult = {
  selected: number;
  requeued: number;
  ids: string[];
};

export type SyncEventStatusCounts = {
  received: number;
  processing: number;
  processed: number;
  failed: number;
  ignored: number;
  deadLettered: number;
  total: number;
};

export type RecoverStuckProcessingEventsInput = {
  staleAfterSeconds?: number;
  limit?: number;
  maxAttempts?: number;
};

export type RecoverStuckProcessingEventsResult = {
  scanned: number;
  recovered: number;
  deadLettered: number;
  requeueIds: string[];
  deadLetterIds: string[];
};

export type SyncMappingStatusCounts = {
  pending: number;
  synced: number;
  failed: number;
  conflict: number;
  total: number;
};

export type ReconcileMappingsInput = {
  limit?: number;
  markConflict?: boolean;
  note?: string;
};

export type ReconcileMappingsResult = {
  scanned: number;
  conflictCount: number;
  invalidCount: number;
  duplicateMedusaKeyCount: number;
  duplicateStrapiKeyCount: number;
  conflictIds: string[];
};

const toDate = (value?: string | Date | null) => {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const withoutUndefined = <T extends Record<string, unknown>>(input: T) => {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

const getNumericStrapiId = (externalId?: string) => {
  if (!externalId || !/^\d+$/.test(externalId)) {
    return undefined;
  }

  return externalId;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown sync error";
};

class SyncModuleService extends MedusaService({
  SyncEvent,
  SyncMapping,
}) {
  async recordEvent({
    event,
    status = "received",
    rawPayload,
    processedAt,
    errorMessage,
  }: RecordSyncEventInput): Promise<RecordSyncEventResult> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const existingEvents = await generated.listSyncEvents(
      { event_id: event.event_id },
      { take: 1 }
    );

    if (existingEvents.length) {
      return {
        event: existingEvents[0],
        duplicate: true,
      };
    }

    const persistedEvent = await generated.createSyncEvents(
      withoutUndefined({
        event_id: event.event_id,
        correlation_id: event.correlation_id,
        source_system: event.source_system,
        target_system: event.target_system,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        external_id: event.external_id,
        operation: event.operation,
        changed_fields: event.changed_fields,
        origin: event.origin,
        occurred_at: toDate(event.timestamp) || new Date(),
        payload_checksum: event.payload_checksum,
        raw_event_name: event.raw_event_name,
        status,
        attempt_count: 0,
        processed_at: toDate(processedAt),
        error_message: errorMessage,
        raw_payload: rawPayload,
      })
    );

    const mapping =
      status === "ignored" ? undefined : await this.upsertMappingFromEvent(event);

    return {
      event: persistedEvent,
      mapping,
      duplicate: false,
    };
  }

  private async upsertMappingFromEvent(event: NormalizedSyncEvent) {
    const medusaId = event.entity_id === "unknown" ? undefined : event.entity_id;
    const strapiDocumentId = event.external_id;

    if (!medusaId && !strapiDocumentId) {
      return undefined;
    }

    const generated = this as unknown as GeneratedSyncModuleService;
    const [existingByStrapiId, existingByMedusaId] = await Promise.all([
      strapiDocumentId
        ? generated.listSyncMappings(
            {
              entity_type: event.entity_type,
              strapi_document_id: strapiDocumentId,
            },
            { take: 1 }
          )
        : Promise.resolve([]),
      medusaId
        ? generated.listSyncMappings(
            {
              entity_type: event.entity_type,
              medusa_id: medusaId,
            },
            { take: 1 }
          )
        : Promise.resolve([]),
    ]);

    const existing = existingByStrapiId[0] || existingByMedusaId[0];
    const mappingData = withoutUndefined({
      entity_type: event.entity_type,
      medusa_id: medusaId,
      strapi_document_id: strapiDocumentId,
      strapi_numeric_id: getNumericStrapiId(strapiDocumentId),
      last_synced_at: toDate(event.timestamp) || new Date(),
      last_source: event.source_system as SyncSourceSystem,
      checksum: event.payload_checksum,
      sync_status: "synced" as const,
      last_error: null,
    });

    return this.upsertMapping({
      entityType: event.entity_type,
      medusaId,
      strapiDocumentId,
      strapiNumericId: getNumericStrapiId(strapiDocumentId),
      lastSource: event.source_system as SyncSourceSystem,
      checksum: event.payload_checksum,
      syncStatus: "synced",
      lastError: null,
      locale: existing?.locale,
    });
  }

  async listProcessableEvents({
    batchSize = 25,
    maxAttempts = 5,
  }: {
    batchSize?: number;
    maxAttempts?: number;
  } = {}) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const events = await generated.listSyncEvents({}, { take: Math.max(batchSize * 5, 25) });

    return events
      .filter((event) => {
        if (event.status !== "received" && event.status !== "failed") {
          return false;
        }

        return Number(event.attempt_count || 0) < maxAttempts;
      })
      .sort((a, b) => {
        return new Date(a.created_at || a.occurred_at).getTime() -
          new Date(b.created_at || b.occurred_at).getTime();
      })
      .slice(0, batchSize);
  }

  async markEventProcessing({
    eventId,
    attemptCount,
  }: {
    eventId: string;
    attemptCount: number;
  }) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const [event] = await generated.updateSyncEvents({
      selector: {
        id: eventId,
      },
      data: {
        status: "processing",
        attempt_count: attemptCount,
        error_message: null,
      },
    });

    return event;
  }

  async markEventProcessed({
    eventId,
  }: {
    eventId: string;
  }) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const [event] = await generated.updateSyncEvents({
      selector: {
        id: eventId,
      },
      data: {
        status: "processed",
        processed_at: new Date(),
        error_message: null,
      },
    });

    return event;
  }

  async markEventFailed({
    eventId,
    error,
    deadLettered = false,
  }: {
    eventId: string;
    error: unknown;
    deadLettered?: boolean;
  }) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const message = deadLettered
      ? `[DEAD_LETTER] ${toErrorMessage(error)}`
      : toErrorMessage(error);
    const [event] = await generated.updateSyncEvents({
      selector: {
        id: eventId,
      },
      data: {
        status: "failed",
        error_message: message,
        processed_at: new Date(),
      },
    });

    return event;
  }

  async listFailedEvents({
    limit = 50,
    includeDeadLettered = true,
  }: {
    limit?: number;
    includeDeadLettered?: boolean;
  } = {}) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const events = await generated.listSyncEvents(
      {
        status: "failed",
      },
      { take: Math.max(limit, 1) }
    );

    if (includeDeadLettered) {
      return events;
    }

    return events.filter((event) => {
      return !String(event.error_message || "").includes("[DEAD_LETTER]");
    });
  }

  async requeueFailedEvents({
    ids,
    limit = 25,
    includeDeadLettered = true,
    resetAttempts = false,
  }: RequeueFailedEventsInput = {}): Promise<RequeueFailedEventsResult> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const candidates = ids?.length
      ? await generated.listSyncEvents(
          {
            id: ids,
          },
          {
            take: ids.length,
          }
        )
      : await this.listFailedEvents({
          limit,
          includeDeadLettered,
        });
    const failedEvents = candidates.filter((event) => {
      if (event.status !== "failed") {
        return false;
      }

      if (!includeDeadLettered) {
        return !String(event.error_message || "").includes("[DEAD_LETTER]");
      }

      return true;
    });

    for (const event of failedEvents) {
      await generated.updateSyncEvents({
        selector: {
          id: event.id,
        },
        data: {
          status: "received",
          error_message: null,
          processed_at: null,
          attempt_count: resetAttempts ? 0 : event.attempt_count,
        },
      });
    }

    return {
      selected: failedEvents.length,
      requeued: failedEvents.length,
      ids: failedEvents.map((event) => event.id),
    };
  }

  async listEventsByIds(ids: string[]) {
    const generated = this as unknown as GeneratedSyncModuleService;

    if (!ids.length) {
      return [];
    }

    return generated.listSyncEvents(
      {
        id: ids,
      },
      {
        take: ids.length,
      }
    );
  }

  async listRecentEvents(limit = 50) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(limit) || 50, 200), 1);
    const events = await generated.listSyncEvents({}, { take: Math.max(take * 3, 50) });

    return events
      .sort((a, b) => {
        return new Date(b.created_at || b.occurred_at).getTime() -
          new Date(a.created_at || a.occurred_at).getTime();
      })
      .slice(0, take);
  }

  async getEventStatusCounts(scanLimit = 1000): Promise<SyncEventStatusCounts> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(scanLimit) || 1000, 5000), 1);
    const events = await generated.listSyncEvents({}, { take });
    const counts: SyncEventStatusCounts = {
      received: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      ignored: 0,
      deadLettered: 0,
      total: events.length,
    };

    for (const event of events) {
      const status = String(event.status || "");

      if (status === "received") {
        counts.received += 1;
      } else if (status === "processing") {
        counts.processing += 1;
      } else if (status === "processed") {
        counts.processed += 1;
      } else if (status === "failed") {
        counts.failed += 1;
      } else if (status === "ignored") {
        counts.ignored += 1;
      }

      if (String(event.error_message || "").includes("[DEAD_LETTER]")) {
        counts.deadLettered += 1;
      }
    }

    return counts;
  }

  async recoverStuckProcessingEvents({
    staleAfterSeconds = 600,
    limit = 100,
    maxAttempts = 5,
  }: RecoverStuckProcessingEventsInput = {}): Promise<RecoverStuckProcessingEventsResult> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(limit) || 100, 500), 1);
    const timeoutMs = Math.max(Number(staleAfterSeconds) || 600, 10) * 1000;
    const now = Date.now();
    const candidates = await generated.listSyncEvents(
      {
        status: "processing",
      },
      { take }
    );
    const staleEvents = candidates.filter((event) => {
      const reference = new Date(
        event.updated_at || event.created_at || event.occurred_at || now
      ).getTime();

      return now - reference >= timeoutMs;
    });
    const requeueIds: string[] = [];
    const deadLetterIds: string[] = [];

    for (const event of staleEvents) {
      const attempts = Number(event.attempt_count || 0);
      const deadLettered = attempts >= maxAttempts;
      const errorMessage = deadLettered
        ? "[DEAD_LETTER][LEASE_TIMEOUT] Processing lease timed out and max attempts reached"
        : "[LEASE_TIMEOUT] Processing lease timed out; event returned to queue";

      await generated.updateSyncEvents({
        selector: {
          id: event.id,
        },
        data: {
          status: deadLettered ? "failed" : "received",
          error_message: errorMessage,
          processed_at: deadLettered ? new Date() : null,
        },
      });

      if (deadLettered) {
        deadLetterIds.push(event.id);
      } else {
        requeueIds.push(event.id);
      }
    }

    return {
      scanned: candidates.length,
      recovered: requeueIds.length,
      deadLettered: deadLetterIds.length,
      requeueIds,
      deadLetterIds,
    };
  }

  async listMappingsByStatus({
    status,
    limit = 100,
  }: {
    status: "pending" | "synced" | "failed" | "conflict";
    limit?: number;
  }) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(limit) || 100, 500), 1);
    const mappings = await generated.listSyncMappings(
      {
        sync_status: status,
      },
      { take: Math.max(take * 2, 100) }
    );

    return mappings
      .sort((a, b) => {
        return new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, take);
  }

  async getMappingStatusCounts(scanLimit = 1000): Promise<SyncMappingStatusCounts> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(scanLimit) || 1000, 10000), 1);
    const mappings = await generated.listSyncMappings({}, { take });
    const counts: SyncMappingStatusCounts = {
      pending: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
      total: mappings.length,
    };

    for (const mapping of mappings) {
      const status = String(mapping.sync_status || "");

      if (status === "pending") {
        counts.pending += 1;
      } else if (status === "synced") {
        counts.synced += 1;
      } else if (status === "failed") {
        counts.failed += 1;
      } else if (status === "conflict") {
        counts.conflict += 1;
      }
    }

    return counts;
  }

  async reconcileMappings({
    limit = 2000,
    markConflict = true,
    note,
  }: ReconcileMappingsInput = {}): Promise<ReconcileMappingsResult> {
    const generated = this as unknown as GeneratedSyncModuleService;
    const take = Math.max(Math.min(Number(limit) || 2000, 20000), 1);
    const mappings = await generated.listSyncMappings({}, { take });
    const byMedusaKey = new Map<string, any[]>();
    const byStrapiKey = new Map<string, any[]>();
    const conflictIds = new Set<string>();
    const invalidIds = new Set<string>();

    for (const mapping of mappings) {
      const medusaId = String(mapping.medusa_id || "").trim();
      const strapiId = String(mapping.strapi_document_id || "").trim();
      const entityType = String(mapping.entity_type || "").trim() || "unknown";

      if (medusaId) {
        const key = `${entityType}::medusa::${medusaId}`;
        byMedusaKey.set(key, [...(byMedusaKey.get(key) || []), mapping]);
      }

      if (strapiId) {
        const key = `${entityType}::strapi::${strapiId}`;
        byStrapiKey.set(key, [...(byStrapiKey.get(key) || []), mapping]);
      }

      if (!medusaId && !strapiId) {
        conflictIds.add(mapping.id);
        invalidIds.add(mapping.id);
      }
    }

    let duplicateMedusaKeyCount = 0;
    let duplicateStrapiKeyCount = 0;

    for (const items of byMedusaKey.values()) {
      if (items.length > 1) {
        duplicateMedusaKeyCount += 1;
        for (const item of items) {
          conflictIds.add(item.id);
        }
      }
    }

    for (const items of byStrapiKey.values()) {
      if (items.length > 1) {
        duplicateStrapiKeyCount += 1;
        for (const item of items) {
          conflictIds.add(item.id);
        }
      }
    }

    const conflictIdList = Array.from(conflictIds);

    if (markConflict && conflictIdList.length) {
      const conflictReason =
        note ||
        "[RECONCILE_CONFLICT] Duplicate/invalid sync mapping detected by reconciliation";

      for (const mappingId of conflictIdList) {
        await generated.updateSyncMappings({
          selector: {
            id: mappingId,
          },
          data: {
            sync_status: "conflict",
            last_error: conflictReason,
          },
        });
      }
    }

    return {
      scanned: mappings.length,
      conflictCount: conflictIdList.length,
      invalidCount: invalidIds.size,
      duplicateMedusaKeyCount,
      duplicateStrapiKeyCount,
      conflictIds: conflictIdList,
    };
  }

  async resolveMappingConflicts({
    ids,
    status = "synced",
    note,
  }: {
    ids: string[];
    status?: "pending" | "synced" | "failed" | "conflict";
    note?: string;
  }) {
    const generated = this as unknown as GeneratedSyncModuleService;

    if (!ids.length) {
      return {
        selected: 0,
        updated: 0,
      };
    }

    const mappings = await generated.listSyncMappings(
      {
        id: ids,
      },
      {
        take: ids.length,
      }
    );

    for (const mapping of mappings) {
      await generated.updateSyncMappings({
        selector: {
          id: mapping.id,
        },
        data: {
          sync_status: status,
          last_error: note || null,
        },
      });
    }

    return {
      selected: ids.length,
      updated: mappings.length,
    };
  }

  async upsertMapping(input: UpsertSyncMappingInput) {
    const generated = this as unknown as GeneratedSyncModuleService;
    const {
      entityType,
      medusaId,
      strapiDocumentId,
      strapiNumericId,
      locale,
      lastSource,
      checksum,
      syncStatus = "synced",
      lastError = null,
    } = input;

    if (!medusaId && !strapiDocumentId) {
      return undefined;
    }

    const [existingByStrapiId, existingByMedusaId] = await Promise.all([
      strapiDocumentId
        ? generated.listSyncMappings(
            {
              entity_type: entityType,
              strapi_document_id: strapiDocumentId,
            },
            { take: 1 }
          )
        : Promise.resolve([]),
      medusaId
        ? generated.listSyncMappings(
            {
              entity_type: entityType,
              medusa_id: medusaId,
            },
            { take: 1 }
          )
        : Promise.resolve([]),
    ]);

    const existing = existingByStrapiId[0] || existingByMedusaId[0];
    const mappingData = withoutUndefined({
      entity_type: entityType,
      medusa_id: medusaId,
      strapi_document_id: strapiDocumentId,
      strapi_numeric_id: strapiNumericId,
      locale,
      last_synced_at: new Date(),
      last_source: lastSource,
      checksum,
      sync_status: syncStatus,
      last_error: lastError,
    });

    if (!existing) {
      return generated.createSyncMappings(mappingData);
    }

    const [updatedMapping] = await generated.updateSyncMappings({
      selector: {
        id: existing.id,
      },
      data: mappingData,
    });

    return updatedMapping;
  }
}

export default SyncModuleService;
