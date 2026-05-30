import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { mapMedusaProductToStrapiEnrichmentInput, mapStrapiEnrichmentToMedusaProductUpdate } from "./ownership-mapper";
import { createStrapiSyncClientFromEnv, isStrapiSyncConfigured } from "./strapi-client";
import { triggerSyncInvalidation } from "./cache-invalidation";
import {
  ackSyncEventIds,
  dequeueSyncEventIds,
  requeueSyncEventIds,
} from "./queue";
import { SYNC_MODULE } from "../../modules/sync";
import SyncModuleService from "../../modules/sync/service";

type SyncEventRecord = {
  id: string;
  entity_type: string;
  entity_id: string;
  source_system: "medusa" | "strapi" | "system";
  payload_checksum: string;
  correlation_id: string;
  external_id?: string;
  raw_payload?: Record<string, unknown>;
  status: string;
  attempt_count: number;
  raw_event_name?: string;
};

type ProcessSyncEventsBatchInput = {
  container: MedusaContainer;
  batchSize?: number;
  maxAttempts?: number;
  concurrency?: number;
};

type ProcessSyncEventsBatchResult = {
  selected: number;
  processed: number;
  failed: number;
  deadLettered: number;
  skipped: number;
};

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_CONCURRENCY = 1;

const isStrapiWriteDisabled = () => {
  return String(process.env.SYNC_DISABLE_STRAPI_WRITES || "").toLowerCase() === "true";
};

const getStrapiEntry = (rawPayload?: Record<string, unknown>) => {
  if (!rawPayload) {
    return undefined;
  }

  const payload = rawPayload as Record<string, any>;

  return payload.entry || payload.after || payload.data;
};

const getExternalIdFromStrapiEntry = (entry: Record<string, any>) => {
  const value = entry.documentId || entry.document_id || entry.id;

  return value == null ? undefined : String(value);
};

const canWriteToStrapi = ({
  logger,
  reasonLabel,
}: {
  logger: any;
  reasonLabel: string;
}) => {
  if (isStrapiWriteDisabled()) {
    logger.warn(
      `[sync] Skipping Medusa -> Strapi write (${reasonLabel}); SYNC_DISABLE_STRAPI_WRITES=true`
    );
    return false;
  }

  if (!isStrapiSyncConfigured()) {
    logger.warn(
      `[sync] Skipping Medusa -> Strapi write (${reasonLabel}); STRAPI_URL/STRAPI_API_TOKEN not configured`
    );
    return false;
  }

  return true;
};

const syncMedusaProductByIdToStrapi = async ({
  container,
  productId,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  productId: string;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  const productService = container.resolve(Modules.PRODUCT) as any;
  const product = await productService.retrieveProduct(productId, {
    relations: ["variants"],
  });
  const payload = mapMedusaProductToStrapiEnrichmentInput({
    product,
    correlationId: event.correlation_id,
  });
  const strapiClient = createStrapiSyncClientFromEnv();
  const result = await strapiClient.upsertProductEnrichmentByMedusaId(
    payload.medusa_id,
    payload
  );

  await syncModuleService.upsertMapping({
    entityType: "product",
    medusaId: productId,
    strapiDocumentId: result.documentId || result.id,
    strapiNumericId: result.id,
    lastSource: "medusa",
    checksum: event.payload_checksum,
    syncStatus: "synced",
    lastError: null,
  });

  logger.info(
    `[sync] Medusa product ${productId} synced to Strapi (${result.documentId || result.id || "unknown"}).`
  );

  return true;
};

const syncMedusaProductToStrapi = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (!canWriteToStrapi({ logger, reasonLabel: `product:${event.entity_id}` })) {
    return false;
  }

  return syncMedusaProductByIdToStrapi({
    container,
    productId: event.entity_id,
    event,
    logger,
    syncModuleService,
  });
};

const syncMedusaProductVariantToStrapi = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (!canWriteToStrapi({ logger, reasonLabel: `product_variant:${event.entity_id}` })) {
    return false;
  }

  const productService = container.resolve(Modules.PRODUCT) as any;
  const variant = await productService.retrieveProductVariant(event.entity_id, {
    relations: ["product"],
  });
  const productId = variant?.product_id || variant?.product?.id;

  if (!productId) {
    logger.warn(
      `[sync] Product variant ${event.entity_id} has no product_id. Skipping variant sync.`
    );
    return false;
  }

  return syncMedusaProductByIdToStrapi({
    container,
    productId: String(productId),
    event,
    logger,
    syncModuleService,
  });
};

const syncMedusaProductCategoryToStrapi = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (!canWriteToStrapi({ logger, reasonLabel: `product_category:${event.entity_id}` })) {
    return false;
  }

  const productService = container.resolve(Modules.PRODUCT) as any;
  const products = await productService.listProducts(
    {
      categories: {
        id: event.entity_id,
      },
    },
    {
      relations: ["variants"],
      take: 100,
    }
  );

  if (!products.length) {
    logger.warn(
      `[sync] No products found for category ${event.entity_id}. Skipping category sync.`
    );
    return false;
  }

  let processed = 0;

  for (const product of products) {
    const productId = String(product.id);
    await syncMedusaProductByIdToStrapi({
      container,
      productId,
      event,
      logger,
      syncModuleService,
    });
    processed += 1;
  }

  logger.info(
    `[sync] Synced ${processed} products for category ${event.entity_id}.`
  );

  return processed > 0;
};

const getUniqueIds = (values: Array<string | undefined | null>) => {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean))
  );
};

const resolveProductIdsFromVariantIds = async ({
  container,
  variantIds,
}: {
  container: MedusaContainer;
  variantIds: string[];
}) => {
  if (!variantIds.length) {
    return [];
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data: variants = [] } = await query.graph({
    entity: "variants",
    fields: ["id", "product_id"],
    filters: {
      id: variantIds,
    },
  });

  return getUniqueIds(
    variants.map((variant: Record<string, unknown>) => {
      return variant.product_id as string | undefined;
    })
  );
};

const resolveProductIdsFromInventoryEntity = async ({
  container,
  event,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
}) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  let inventoryItemIds: string[] = [];

  if (event.entity_type === "inventory_item") {
    inventoryItemIds = [event.entity_id];
  } else if (event.entity_type === "inventory_level") {
    const { data: levels = [] } = await query.graph({
      entity: "inventory_levels",
      fields: ["id", "inventory_item_id"],
      filters: {
        id: [event.entity_id],
      },
    });

    inventoryItemIds = getUniqueIds(
      levels.map((level: Record<string, unknown>) => {
        return level.inventory_item_id as string | undefined;
      })
    );
  } else if (event.entity_type === "reservation_item") {
    const { data: reservationItems = [] } = await query.graph({
      entity: "reservation_items",
      fields: ["id", "inventory_item_id"],
      filters: {
        id: [event.entity_id],
      },
    });

    inventoryItemIds = getUniqueIds(
      reservationItems.map((item: Record<string, unknown>) => {
        return item.inventory_item_id as string | undefined;
      })
    );
  }

  if (!inventoryItemIds.length) {
    return [];
  }

  const { data: variantInventoryItems = [] } = await query.graph({
    entity: "product_variant_inventory_items",
    fields: ["variant_id"],
    filters: {
      inventory_item_id: inventoryItemIds,
    },
  });
  const variantIds = getUniqueIds(
    variantInventoryItems.map((item: Record<string, unknown>) => {
      return item.variant_id as string | undefined;
    })
  );

  return resolveProductIdsFromVariantIds({
    container,
    variantIds,
  });
};

const resolveProductIdsFromPricingEntity = async ({
  container,
  event,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
}) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  let priceSetIds: string[] = [];

  if (event.entity_type === "price_set") {
    priceSetIds = [event.entity_id];
  } else if (event.entity_type === "price") {
    const { data: prices = [] } = await query.graph({
      entity: "prices",
      fields: ["id", "price_set_id"],
      filters: {
        id: [event.entity_id],
      },
    });

    priceSetIds = getUniqueIds(
      prices.map((price: Record<string, unknown>) => {
        return price.price_set_id as string | undefined;
      })
    );
  } else if (event.entity_type === "price_list") {
    const { data: prices = [] } = await query.graph({
      entity: "prices",
      fields: ["id", "price_set_id"],
      filters: {
        price_list_id: [event.entity_id],
      },
    });

    priceSetIds = getUniqueIds(
      prices.map((price: Record<string, unknown>) => {
        return price.price_set_id as string | undefined;
      })
    );
  }

  if (!priceSetIds.length) {
    return [];
  }

  const { data: variantPriceSets = [] } = await query.graph({
    entity: "product_variant_price_sets",
    fields: ["variant_id"],
    filters: {
      price_set_id: priceSetIds,
    },
  });
  const variantIds = getUniqueIds(
    variantPriceSets.map((item: Record<string, unknown>) => {
      return item.variant_id as string | undefined;
    })
  );

  return resolveProductIdsFromVariantIds({
    container,
    variantIds,
  });
};

const syncMedusaInventoryEntityToStrapi = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (!canWriteToStrapi({ logger, reasonLabel: `${event.entity_type}:${event.entity_id}` })) {
    return false;
  }

  const productIds = await resolveProductIdsFromInventoryEntity({
    container,
    event,
  });

  if (!productIds.length) {
    logger.warn(
      `[sync] No related products found for ${event.entity_type}:${event.entity_id}.`
    );
    return false;
  }

  let processed = 0;

  for (const productId of productIds) {
    await syncMedusaProductByIdToStrapi({
      container,
      productId,
      event,
      logger,
      syncModuleService,
    });
    processed += 1;
  }

  logger.info(
    `[sync] Synced ${processed} product(s) for ${event.entity_type}:${event.entity_id}.`
  );

  return processed > 0;
};

const syncMedusaPricingEntityToStrapi = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (!canWriteToStrapi({ logger, reasonLabel: `${event.entity_type}:${event.entity_id}` })) {
    return false;
  }

  const productIds = await resolveProductIdsFromPricingEntity({
    container,
    event,
  });

  if (!productIds.length) {
    logger.warn(
      `[sync] No related products found for ${event.entity_type}:${event.entity_id}.`
    );
    return false;
  }

  let processed = 0;

  for (const productId of productIds) {
    await syncMedusaProductByIdToStrapi({
      container,
      productId,
      event,
      logger,
      syncModuleService,
    });
    processed += 1;
  }

  logger.info(
    `[sync] Synced ${processed} product(s) for ${event.entity_type}:${event.entity_id}.`
  );

  return processed > 0;
};

const syncStrapiProductToMedusa = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  const entry = getStrapiEntry(event.raw_payload);

  if (!entry || typeof entry !== "object") {
    throw new Error(
      `[sync] Missing Strapi entry payload for event ${event.raw_event_name || event.id}`
    );
  }

  const updateInput = mapStrapiEnrichmentToMedusaProductUpdate({
    entry,
    correlationId: event.correlation_id,
  });

  if (!updateInput) {
    throw new Error("[sync] Strapi payload is missing medusa_id for update");
  }

  const productService = container.resolve(Modules.PRODUCT) as any;
  await productService.updateProducts(updateInput.id, updateInput);

  await syncModuleService.upsertMapping({
    entityType: "product",
    medusaId: updateInput.id,
    strapiDocumentId:
      getExternalIdFromStrapiEntry(entry as Record<string, any>) || event.external_id,
    strapiNumericId: (() => {
      const idValue = (entry as Record<string, any>).id;

      return idValue == null ? undefined : String(idValue);
    })(),
    lastSource: "strapi",
    checksum: event.payload_checksum,
    syncStatus: "synced",
    lastError: null,
  });

  logger.info(`[sync] Strapi product synced to Medusa ${updateInput.id}.`);

  return true;
};

const processSyncEvent = async ({
  container,
  event,
  logger,
  syncModuleService,
}: {
  container: MedusaContainer;
  event: SyncEventRecord;
  logger: any;
  syncModuleService: SyncModuleService;
}) => {
  if (event.source_system === "medusa" && event.entity_type === "product") {
    return await syncMedusaProductToStrapi({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  if (event.source_system === "medusa" && event.entity_type === "product_variant") {
    return await syncMedusaProductVariantToStrapi({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  if (event.source_system === "medusa" && event.entity_type === "product_category") {
    return await syncMedusaProductCategoryToStrapi({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  if (
    event.source_system === "medusa" &&
    (event.entity_type === "inventory_item" ||
      event.entity_type === "inventory_level" ||
      event.entity_type === "reservation_item")
  ) {
    return await syncMedusaInventoryEntityToStrapi({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  if (
    event.source_system === "medusa" &&
    (event.entity_type === "price_set" ||
      event.entity_type === "price" ||
      event.entity_type === "price_list")
  ) {
    return await syncMedusaPricingEntityToStrapi({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  if (event.source_system === "strapi" && event.entity_type === "product") {
    return await syncStrapiProductToMedusa({
      container,
      event,
      logger,
      syncModuleService,
    });
  }

  logger.warn(
    `[sync] No handler for ${event.source_system}:${event.entity_type}. Event ${event.id} marked processed as skipped.`
  );

  return false;
};

const tryTriggerSyncInvalidation = async ({
  logger,
  event,
}: {
  logger: any;
  event: SyncEventRecord;
}) => {
  if (event.entity_type !== "product") {
    return;
  }

  try {
    const result = await triggerSyncInvalidation({
      entityType: event.entity_type,
      entityId: event.entity_id,
      sourceSystem: event.source_system,
      correlationId: event.correlation_id,
      payloadChecksum: event.payload_checksum,
    });

    if (!result.sent) {
      logger.debug?.(
        `[sync] Cache invalidation skipped for ${event.entity_type}:${event.entity_id}: ${result.reason}`
      );
    }
  } catch (error) {
    logger.warn(
      `[sync] Cache invalidation failed for ${event.entity_type}:${event.entity_id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const processSyncEventsBatch = async ({
  container,
  batchSize = DEFAULT_BATCH_SIZE,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  concurrency = DEFAULT_CONCURRENCY,
}: ProcessSyncEventsBatchInput): Promise<ProcessSyncEventsBatchResult> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const syncModuleService: SyncModuleService = container.resolve(SYNC_MODULE);
  const events = (await syncModuleService.listProcessableEvents({
    batchSize,
    maxAttempts,
  })) as SyncEventRecord[];
  return processSyncEventRecords({
    container,
    events,
    maxAttempts,
    concurrency,
    logger,
    syncModuleService,
    requeueOnRetry: false,
    ackQueueEvents: false,
  });
};

export const processSyncEventsFromQueue = async ({
  container,
  batchSize = DEFAULT_BATCH_SIZE,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  concurrency = DEFAULT_CONCURRENCY,
}: ProcessSyncEventsBatchInput): Promise<ProcessSyncEventsBatchResult> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const syncModuleService: SyncModuleService = container.resolve(SYNC_MODULE);
  const queuedEventIds = await dequeueSyncEventIds({
    batchSize,
  });

  if (!queuedEventIds.length) {
    return {
      selected: 0,
      processed: 0,
      failed: 0,
      deadLettered: 0,
      skipped: 0,
    };
  }

  const events = (await syncModuleService.listEventsByIds(
    queuedEventIds
  )) as SyncEventRecord[];
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const missingIds = queuedEventIds.filter((eventId) => !eventsById.has(eventId));
  const missingCount = missingIds.length;
  const orderedEvents = queuedEventIds
    .map((eventId) => eventsById.get(eventId))
    .filter(Boolean) as SyncEventRecord[];

  if (missingCount) {
    logger.warn(
      `[sync] ${missingCount} queued event id(s) were not found in sync_event table.`
    );
    await ackSyncEventIds(missingIds);
  }

  const summary = await processSyncEventRecords({
    container,
    events: orderedEvents,
    maxAttempts,
    concurrency,
    logger,
    syncModuleService,
    requeueOnRetry: true,
    ackQueueEvents: true,
  });

  return {
    ...summary,
    selected: queuedEventIds.length,
    skipped: summary.skipped + missingCount,
  };
};

const processSyncEventRecords = async ({
  container,
  events,
  maxAttempts,
  concurrency,
  logger,
  syncModuleService,
  requeueOnRetry,
  ackQueueEvents,
}: {
  container: MedusaContainer;
  events: SyncEventRecord[];
  maxAttempts: number;
  concurrency: number;
  logger: any;
  syncModuleService: SyncModuleService;
  requeueOnRetry: boolean;
  ackQueueEvents: boolean;
}): Promise<ProcessSyncEventsBatchResult> => {
  const summary: ProcessSyncEventsBatchResult = {
    selected: events.length,
    processed: 0,
    failed: 0,
    deadLettered: 0,
    skipped: 0,
  };
  const retryQueueIds: string[] = [];
  const completedQueueIds: string[] = [];
  const normalizedConcurrency = Math.max(1, Math.min(Number(concurrency) || 1, 20));
  const workerCount = Math.min(normalizedConcurrency, events.length || 1);

  const processOneEvent = async (event: SyncEventRecord) => {
    const nextAttempt = Number(event.attempt_count || 0) + 1;

    await syncModuleService.markEventProcessing({
      eventId: event.id,
      attemptCount: nextAttempt,
    });

    try {
      const handled = await processSyncEvent({
        container,
        event,
        logger,
        syncModuleService,
      });

      await syncModuleService.markEventProcessed({
        eventId: event.id,
      });
      await tryTriggerSyncInvalidation({
        logger,
        event,
      });

      if (handled) {
        summary.processed += 1;
      } else {
        summary.skipped += 1;
      }

      if (ackQueueEvents) {
        completedQueueIds.push(event.id);
      }
    } catch (error) {
      const deadLettered = nextAttempt >= maxAttempts;
      summary.failed += 1;

      if (deadLettered) {
        summary.deadLettered += 1;
      }

      await syncModuleService.markEventFailed({
        eventId: event.id,
        error,
        deadLettered,
      });

      logger.error(
        `[sync] Failed processing event ${event.id} (${event.source_system}:${event.entity_type}) attempt ${nextAttempt}/${maxAttempts}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      if (!deadLettered && requeueOnRetry) {
        retryQueueIds.push(event.id);
      } else if (ackQueueEvents) {
        completedQueueIds.push(event.id);
      }
    }
  };

  let cursor = 0;
  const runWorker = async () => {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;

      if (currentIndex >= events.length) {
        return;
      }

      await processOneEvent(events[currentIndex]);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  if (retryQueueIds.length) {
    await requeueSyncEventIds(retryQueueIds);
  }

  if (ackQueueEvents && completedQueueIds.length) {
    await ackSyncEventIds(completedQueueIds);
  }

  return summary;
};
