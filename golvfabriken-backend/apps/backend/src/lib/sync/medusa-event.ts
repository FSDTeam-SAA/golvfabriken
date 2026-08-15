import { InventoryEvents, PricingEvents, ProductEvents } from "@medusajs/framework/utils";
import {
  NormalizedSyncEvent,
  SyncOperation,
  createCorrelationId,
  createDeterministicEventId,
  createPayloadChecksum,
} from "./events";

type MedusaSyncEventDescriptor = {
  entity_type: string;
  operation: SyncOperation;
};

type MedusaSyncEventInput = {
  eventName: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  correlationId?: string;
  timestamp?: string;
};

const MEDUSA_SYNC_EVENT_MAP: Record<string, MedusaSyncEventDescriptor> = {
  [ProductEvents.PRODUCT_CREATED]: {
    entity_type: "product",
    operation: "create",
  },
  [ProductEvents.PRODUCT_UPDATED]: {
    entity_type: "product",
    operation: "update",
  },
  [ProductEvents.PRODUCT_DELETED]: {
    entity_type: "product",
    operation: "delete",
  },
  [ProductEvents.PRODUCT_RESTORED]: {
    entity_type: "product",
    operation: "update",
  },
  [ProductEvents.PRODUCT_CATEGORY_CREATED]: {
    entity_type: "product_category",
    operation: "create",
  },
  [ProductEvents.PRODUCT_CATEGORY_UPDATED]: {
    entity_type: "product_category",
    operation: "update",
  },
  [ProductEvents.PRODUCT_CATEGORY_DELETED]: {
    entity_type: "product_category",
    operation: "delete",
  },
  [ProductEvents.PRODUCT_CATEGORY_RESTORED]: {
    entity_type: "product_category",
    operation: "update",
  },
  [ProductEvents.PRODUCT_VARIANT_CREATED]: {
    entity_type: "product_variant",
    operation: "create",
  },
  [ProductEvents.PRODUCT_VARIANT_UPDATED]: {
    entity_type: "product_variant",
    operation: "update",
  },
  [ProductEvents.PRODUCT_VARIANT_DELETED]: {
    entity_type: "product_variant",
    operation: "delete",
  },
  [ProductEvents.PRODUCT_VARIANT_RESTORED]: {
    entity_type: "product_variant",
    operation: "update",
  },
  [InventoryEvents.INVENTORY_ITEM_CREATED]: {
    entity_type: "inventory_item",
    operation: "create",
  },
  [InventoryEvents.INVENTORY_ITEM_UPDATED]: {
    entity_type: "inventory_item",
    operation: "update",
  },
  [InventoryEvents.INVENTORY_ITEM_DELETED]: {
    entity_type: "inventory_item",
    operation: "delete",
  },
  [InventoryEvents.INVENTORY_ITEM_RESTORED]: {
    entity_type: "inventory_item",
    operation: "update",
  },
  [InventoryEvents.INVENTORY_LEVEL_CREATED]: {
    entity_type: "inventory_level",
    operation: "create",
  },
  [InventoryEvents.INVENTORY_LEVEL_UPDATED]: {
    entity_type: "inventory_level",
    operation: "update",
  },
  [InventoryEvents.INVENTORY_LEVEL_DELETED]: {
    entity_type: "inventory_level",
    operation: "delete",
  },
  [InventoryEvents.INVENTORY_LEVEL_RESTORED]: {
    entity_type: "inventory_level",
    operation: "update",
  },
  [InventoryEvents.RESERVATION_ITEM_CREATED]: {
    entity_type: "reservation_item",
    operation: "create",
  },
  [InventoryEvents.RESERVATION_ITEM_UPDATED]: {
    entity_type: "reservation_item",
    operation: "update",
  },
  [InventoryEvents.RESERVATION_ITEM_DELETED]: {
    entity_type: "reservation_item",
    operation: "delete",
  },
  [InventoryEvents.RESERVATION_ITEM_RESTORED]: {
    entity_type: "reservation_item",
    operation: "update",
  },
  [PricingEvents.PRICE_LIST_CREATED]: {
    entity_type: "price_list",
    operation: "create",
  },
  [PricingEvents.PRICE_LIST_UPDATED]: {
    entity_type: "price_list",
    operation: "update",
  },
  [PricingEvents.PRICE_LIST_DELETED]: {
    entity_type: "price_list",
    operation: "delete",
  },
  [PricingEvents.PRICE_LIST_RESTORED]: {
    entity_type: "price_list",
    operation: "update",
  },
  [PricingEvents.PRICE_SET_CREATED]: {
    entity_type: "price_set",
    operation: "create",
  },
  [PricingEvents.PRICE_SET_UPDATED]: {
    entity_type: "price_set",
    operation: "update",
  },
  [PricingEvents.PRICE_SET_DELETED]: {
    entity_type: "price_set",
    operation: "delete",
  },
  [PricingEvents.PRICE_SET_RESTORED]: {
    entity_type: "price_set",
    operation: "update",
  },
  [PricingEvents.PRICE_CREATED]: {
    entity_type: "price",
    operation: "create",
  },
  [PricingEvents.PRICE_UPDATED]: {
    entity_type: "price",
    operation: "update",
  },
  [PricingEvents.PRICE_DELETED]: {
    entity_type: "price",
    operation: "delete",
  },
  [PricingEvents.PRICE_RESTORED]: {
    entity_type: "price",
    operation: "update",
  },
};

const toArray = <T>(value: T | T[] | undefined) => {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const getPayloadRecords = (
  data?: Record<string, unknown> | Record<string, unknown>[]
) => {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data.filter((item) => isRecord(item));
  }

  return isRecord(data) ? [data] : [];
};

const getIdsFromPayload = (payload: Record<string, unknown>) => {
  const nested = isRecord(payload.data) ? payload.data : undefined;

  return [
    ...toArray(payload.id as string | string[] | undefined),
    ...toArray(payload.ids as string | string[] | undefined),
    ...toArray(nested?.id as string | string[] | undefined),
    ...toArray(nested?.ids as string | string[] | undefined),
  ];
};

const getEntityIds = (data?: Record<string, unknown> | Record<string, unknown>[]) => {
  const ids = getPayloadRecords(data)
    .flatMap((payload) => getIdsFromPayload(payload))
    .map((id) => String(id))
    .filter(Boolean);

  return Array.from(new Set(ids));
};

const normalizeEntityTypeFromEventName = (eventName: string) => {
  if (eventName.includes("product-category")) {
    return "product_category";
  }

  if (eventName.includes("product-variant")) {
    return "product_variant";
  }

  if (eventName.includes("inventory-level")) {
    return "inventory_level";
  }

  if (eventName.includes("reservation-item")) {
    return "reservation_item";
  }

  if (eventName.includes("inventory-item")) {
    return "inventory_item";
  }

  if (eventName.includes("price-list")) {
    return "price_list";
  }

  if (eventName.includes("price-set")) {
    return "price_set";
  }

  if (eventName.includes("price.")) {
    return "price";
  }

  if (eventName.includes("product.")) {
    return "product";
  }

  return "unknown";
};

const normalizeOperationFromEventName = (eventName: string): SyncOperation => {
  if (eventName.endsWith(".created")) {
    return "create";
  }

  if (eventName.endsWith(".updated")) {
    return "update";
  }

  if (eventName.endsWith(".deleted")) {
    return "delete";
  }

  if (eventName.endsWith(".restored")) {
    return "update";
  }

  return "unknown";
};

export const getSyncDescriptorFromMedusaEvent = (
  eventName: string
): MedusaSyncEventDescriptor => {
  return (
    MEDUSA_SYNC_EVENT_MAP[eventName] || {
      entity_type: normalizeEntityTypeFromEventName(eventName),
      operation: normalizeOperationFromEventName(eventName),
    }
  );
};

export const getMedusaSyncCorrelationId = (
  data?: Record<string, unknown> | Record<string, unknown>[]
) => {
  const payload = Array.isArray(data) ? data.find((item) => isRecord(item)) : data;
  const value =
    payload?.sync_correlation_id ||
    payload?.correlation_id ||
    payload?.correlationId ||
    payload?.syncCorrelationId;

  return value ? String(value) : createCorrelationId();
};

export const normalizeMedusaSyncEvents = ({
  eventName,
  data,
  correlationId,
  timestamp,
}: MedusaSyncEventInput): NormalizedSyncEvent[] => {
  const payloads = getPayloadRecords(data);
  const primaryPayload = payloads[0] || {};
  const ids = getEntityIds(data);

  if (!ids.length) {
    return [];
  }

  const occurredAt = timestamp || new Date().toISOString();
  const descriptor = getSyncDescriptorFromMedusaEvent(eventName);

  return ids.map((entityId) => {
    const payloadForChecksum = {
      eventName,
      entityId,
      payload: payloads,
    };
    const payloadChecksum = createPayloadChecksum(payloadForChecksum);

    return {
      event_id: createDeterministicEventId({
        source: "medusa",
        eventName,
        entityId,
        timestamp: occurredAt,
        checksum: payloadChecksum,
      }),
      correlation_id: correlationId || getMedusaSyncCorrelationId(primaryPayload),
      source_system: "medusa",
      target_system: "strapi",
      entity_type: descriptor.entity_type,
      entity_id: entityId,
      operation: descriptor.operation,
      changed_fields: [],
      origin: "system",
      timestamp: occurredAt,
      payload_checksum: payloadChecksum,
      raw_event_name: eventName,
    };
  });
};

export const SUPPORTED_MEDUSA_SYNC_EVENTS = Object.keys(MEDUSA_SYNC_EVENT_MAP);
