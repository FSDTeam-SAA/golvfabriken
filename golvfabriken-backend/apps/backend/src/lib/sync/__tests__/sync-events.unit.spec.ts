import { InventoryEvents, PricingEvents } from "@medusajs/framework/utils";
import { shouldIgnoreSyncEcho } from "../events";
import {
  getSyncDescriptorFromMedusaEvent,
  normalizeMedusaSyncEvents,
} from "../medusa-event";

describe("sync event normalization", () => {
  it("maps reservation item events to reservation_item descriptors", () => {
    const descriptor = getSyncDescriptorFromMedusaEvent(
      InventoryEvents.RESERVATION_ITEM_CREATED
    );

    expect(descriptor).toEqual({
      entity_type: "reservation_item",
      operation: "create",
    });
  });

  it("maps price list events to price_list descriptors", () => {
    const descriptor = getSyncDescriptorFromMedusaEvent(
      PricingEvents.PRICE_LIST_UPDATED
    );

    expect(descriptor).toEqual({
      entity_type: "price_list",
      operation: "update",
    });
  });

  it("normalizes price list event payload ids into sync events", () => {
    const events = normalizeMedusaSyncEvents({
      eventName: PricingEvents.PRICE_LIST_UPDATED,
      data: {
        id: "plist_123",
      },
      correlationId: "corr_test",
      timestamp: "2026-05-30T00:00:00.000Z",
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      entity_type: "price_list",
      entity_id: "plist_123",
      operation: "update",
      correlation_id: "corr_test",
      source_system: "medusa",
      target_system: "strapi",
    });
  });
});

describe("sync echo detection", () => {
  it("ignores Medusa-origin webhook echoes when source is Strapi", () => {
    expect(
      shouldIgnoreSyncEcho({
        sourceSystem: "strapi",
        syncOrigin: "medusa",
      })
    ).toBe(true);

    expect(
      shouldIgnoreSyncEcho({
        sourceSystem: "strapi",
        syncOrigin: "medusa-sync-worker",
      })
    ).toBe(true);
  });

  it("does not ignore user-origin writes", () => {
    expect(
      shouldIgnoreSyncEcho({
        sourceSystem: "strapi",
        syncOrigin: "user",
      })
    ).toBe(false);
  });
});
