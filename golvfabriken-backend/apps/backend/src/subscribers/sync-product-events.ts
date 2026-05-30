import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  InventoryEvents,
  PricingEvents,
  ProductEvents,
} from "@medusajs/framework/utils";
import {
  SUPPORTED_MEDUSA_SYNC_EVENTS,
  getMedusaSyncCorrelationId,
  normalizeMedusaSyncEvents,
} from "../lib/sync/medusa-event";
import { enqueueSyncEventId } from "../lib/sync/queue";
import { SYNC_MODULE } from "../modules/sync";
import SyncModuleService from "../modules/sync/service";

type MedusaEventPayload = {
  id?: string | string[];
  ids?: string[];
  sync_correlation_id?: string;
  correlation_id?: string;
  correlationId?: string;
  syncCorrelationId?: string;
  [key: string]: unknown;
};

export default async function syncProductEventsSubscriber({
  event,
  container,
}: SubscriberArgs<MedusaEventPayload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const syncModuleService: SyncModuleService = container.resolve(SYNC_MODULE);
  const normalizedEvents = normalizeMedusaSyncEvents({
    eventName: event.name,
    data: event.data,
    correlationId: getMedusaSyncCorrelationId(event.data),
  });

  if (!normalizedEvents.length) {
    logger.warn(
      `[sync] Received ${event.name} without usable entity ids. Event skipped.`
    );
    return;
  }

  for (const normalizedEvent of normalizedEvents) {
    const persisted = await syncModuleService.recordEvent({
      event: normalizedEvent,
      status: "received",
      rawPayload: event.data as Record<string, unknown>,
    });

    if (!persisted.duplicate && persisted.event?.id) {
      await enqueueSyncEventId(String(persisted.event.id));
    }
  }

  logger.info(
    `[sync] Recorded ${normalizedEvents.length} Medusa sync event(s) from ${event.name}.`
  );
}

export const config: SubscriberConfig = {
  event: [
    ProductEvents.PRODUCT_CREATED,
    ProductEvents.PRODUCT_UPDATED,
    ProductEvents.PRODUCT_DELETED,
    ProductEvents.PRODUCT_RESTORED,
    ProductEvents.PRODUCT_VARIANT_CREATED,
    ProductEvents.PRODUCT_VARIANT_UPDATED,
    ProductEvents.PRODUCT_VARIANT_DELETED,
    ProductEvents.PRODUCT_VARIANT_RESTORED,
    ProductEvents.PRODUCT_CATEGORY_CREATED,
    ProductEvents.PRODUCT_CATEGORY_UPDATED,
    ProductEvents.PRODUCT_CATEGORY_DELETED,
    ProductEvents.PRODUCT_CATEGORY_RESTORED,
    InventoryEvents.INVENTORY_ITEM_CREATED,
    InventoryEvents.INVENTORY_ITEM_UPDATED,
    InventoryEvents.INVENTORY_ITEM_DELETED,
    InventoryEvents.INVENTORY_ITEM_RESTORED,
    InventoryEvents.INVENTORY_LEVEL_CREATED,
    InventoryEvents.INVENTORY_LEVEL_UPDATED,
    InventoryEvents.INVENTORY_LEVEL_DELETED,
    InventoryEvents.INVENTORY_LEVEL_RESTORED,
    InventoryEvents.RESERVATION_ITEM_CREATED,
    InventoryEvents.RESERVATION_ITEM_UPDATED,
    InventoryEvents.RESERVATION_ITEM_DELETED,
    InventoryEvents.RESERVATION_ITEM_RESTORED,
    PricingEvents.PRICE_LIST_CREATED,
    PricingEvents.PRICE_LIST_UPDATED,
    PricingEvents.PRICE_LIST_DELETED,
    PricingEvents.PRICE_LIST_RESTORED,
    PricingEvents.PRICE_SET_CREATED,
    PricingEvents.PRICE_SET_UPDATED,
    PricingEvents.PRICE_SET_DELETED,
    PricingEvents.PRICE_SET_RESTORED,
    PricingEvents.PRICE_CREATED,
    PricingEvents.PRICE_UPDATED,
    PricingEvents.PRICE_DELETED,
    PricingEvents.PRICE_RESTORED,
  ],
  context: {
    subscriberId: "sync-product-events",
  },
};

// Keep this explicit for quick validation in tests and diagnostics.
export const subscribedEvents = SUPPORTED_MEDUSA_SYNC_EVENTS;
