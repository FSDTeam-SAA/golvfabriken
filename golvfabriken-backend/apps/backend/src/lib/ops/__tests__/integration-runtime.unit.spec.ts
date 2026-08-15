import {
  buildShippingPackagePlan,
  buildKlarnaSessionPreview,
  buildShippingQuotePreview,
  getIntegrationRuntimeReport,
  resolveKlarnaCapture,
  resolveKlarnaCreateOrder,
  resolveKlarnaRefund,
  resolveShippingAddressValidation,
  resolveShippingBooking,
  resolveShippingLabel,
  resolveKlarnaSession,
  resolveShippingQuote,
  resolveShippingTracking,
} from "../integration-runtime";

describe("ops integration runtime", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns skip mode when required env keys are missing", () => {
    const report = getIntegrationRuntimeReport("fraktjakt");

    expect(report.key).toBe("fraktjakt");
    expect(["live", "skip"]).toContain(report.mode);
    if (!report.ready) {
      expect(report.missingKeys.length).toBeGreaterThan(0);
    }
  });

  it("builds shipping preview quotes", () => {
    const quotes = buildShippingQuotePreview({
      destination_country: "SE",
      postal_code: "11122",
      items: [
        {
          sku: "SKU-1",
          quantity: 2,
          weight_kg: 12,
          unit_price: 599,
        },
      ],
    });

    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].mode).toBe("simulated");
  });

  it("builds shipping package plan from pallet/component metadata", () => {
    const packagePlan = buildShippingPackagePlan([
      {
        sku: "FLOOR-1",
        quantity: 2,
        weight_kg: 12,
        volume_m3: 0.3,
        shipment_type: "pallet",
        pallet_count: 1,
        loading_meters: 0.5,
        component_breakdown: {
          plank: 20,
          underlay: 2,
        },
      },
      {
        sku: "FLOOR-2",
        quantity: 1,
        weight_kg: 5,
        component_breakdown: [{ component: "adhesive", quantity: 3 }],
      },
    ]);

    expect(packagePlan.total_items).toBe(2);
    expect(packagePlan.total_quantity).toBe(3);
    expect(packagePlan.total_pallet_count).toBe(2);
    expect(packagePlan.shipment_types).toContain("pallet");
    expect(packagePlan.component_totals.find((x) => x.key === "plank")?.quantity).toBe(40);
  });

  it("builds klarna preview session", () => {
    const session = buildKlarnaSessionPreview({
      amount: 1499,
      currency_code: "sek",
      order_reference: "ord_123",
    });

    expect(session.provider).toBe("klarna");
    expect(session.status).toBe("preview");
    expect(session.amount).toBe(1499);
  });

  it("returns live shipping quote when fraktjakt responds", async () => {
    process.env.FRAKTJAKT_API_URL = "https://example.fraktjakt.local";
    process.env.FRAKTJAKT_API_KEY = "test-key";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        quotes: [
          {
            carrier: "Fraktjakt",
            service: "Standard",
            amount: 149,
            currency_code: "SEK",
            estimated_days: 2,
          },
        ],
      }),
    } as any);

    const result = await resolveShippingQuote({
      destination_country: "SE",
      postal_code: "11122",
      currency_code: "SEK",
      items: [{ quantity: 1, weight_kg: 8 }],
    });

    expect(result.mode).toBe("live");
    expect(result.quotes[0].mode).toBe("live");
    expect(result.quotes[0].amount).toBe(149);
  });

  it("falls back to simulated shipping quote on live error", async () => {
    process.env.FRAKTJAKT_API_URL = "https://example.fraktjakt.local";
    process.env.FRAKTJAKT_API_KEY = "test-key";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "true";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any);

    const result = await resolveShippingQuote({
      destination_country: "SE",
      postal_code: "11122",
      items: [{ quantity: 1, weight_kg: 8 }],
    });

    expect(result.mode).toBe("simulated");
    expect(result.quotes[0].mode).toBe("simulated");
  });

  it("returns live klarna session when klarna responds", async () => {
    process.env.KLARNA_API_BASE_URL = "https://api.playground.klarna.com";
    process.env.KLARNA_USERNAME = "merchant";
    process.env.KLARNA_PASSWORD = "secret";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        client_token: "client_token_live",
        session_id: "sess_live_1",
      }),
    } as any);

    const result = await resolveKlarnaSession({
      amount: 1200,
      currency_code: "SEK",
      locale: "sv-SE",
      order_reference: "ord-1",
    });

    expect(result.mode).toBe("live");
    expect(result.session.provider).toBe("klarna");
    expect(result.session.client_token).toBe("client_token_live");
  });

  it("returns simulated shipping booking when keys are missing and simulation enabled", async () => {
    delete process.env.FRAKTJAKT_API_URL;
    delete process.env.FRAKTJAKT_API_KEY;
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "true";

    const result = await resolveShippingBooking({
      order_reference: "ord-123",
      destination_country: "SE",
      postal_code: "11122",
      items: [{ quantity: 2, weight_kg: 10, pallet_count: 1 }],
    });

    expect(result.mode).toBe("simulated");
    expect((result.booking as any).shipment_id).toBeDefined();
    expect((result.booking as any).package_plan).toBeDefined();
  });

  it("returns live shipping label when fraktjakt label endpoint responds", async () => {
    process.env.FRAKTJAKT_API_URL = "https://example.fraktjakt.local";
    process.env.FRAKTJAKT_API_KEY = "test-key";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        label_url: "https://labels.local/ship-1.pdf",
      }),
    } as any);

    const result = await resolveShippingLabel("ship-1");

    expect(result.mode).toBe("live");
    expect(result.label.label_url).toBe("https://labels.local/ship-1.pdf");
  });

  it("returns live shipping tracking when fraktjakt tracking endpoint responds", async () => {
    process.env.FRAKTJAKT_API_URL = "https://example.fraktjakt.local";
    process.env.FRAKTJAKT_API_KEY = "test-key";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tracking_number: "TRK123",
        status: "in_transit",
        events: [{ status: "picked_up" }],
      }),
    } as any);

    const result = await resolveShippingTracking("ship-2");

    expect(result.mode).toBe("live");
    expect(result.tracking.tracking_number).toBe("TRK123");
  });

  it("returns live address validation when fraktjakt validates address", async () => {
    process.env.FRAKTJAKT_API_URL = "https://example.fraktjakt.local";
    process.env.FRAKTJAKT_API_KEY = "test-key";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        is_valid: true,
        normalized_address: {
          city: "Stockholm",
          postal_code: "11122",
        },
      }),
    } as any);

    const result = await resolveShippingAddressValidation({
      country_code: "SE",
      postal_code: "11122",
      city: "Stockholm",
      address_line1: "Main 1",
    });

    expect(result.mode).toBe("live");
    expect(result.validation.is_valid).toBe(true);
    expect(result.validation.source).toBe("fraktjakt_live");
  });

  it("returns live klarna order/capture/refund flows when klarna responds", async () => {
    process.env.KLARNA_API_BASE_URL = "https://api.playground.klarna.com";
    process.env.KLARNA_USERNAME = "merchant";
    process.env.KLARNA_PASSWORD = "secret";
    process.env.OPS_INTEGRATION_SIMULATION_MODE = "false";

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order_id: "klarna-order-1",
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          capture_id: "cap-1",
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refund_id: "ref-1",
        }),
      } as any);
    global.fetch = fetchMock as any;

    const order = await resolveKlarnaCreateOrder({
      authorization_token: "auth-1",
      amount: 1200,
      currency_code: "SEK",
      purchase_country: "SE",
    });
    const capture = await resolveKlarnaCapture({
      order_id: "klarna-order-1",
      captured_amount: 1200,
    });
    const refund = await resolveKlarnaRefund({
      order_id: "klarna-order-1",
      refunded_amount: 200,
    });

    expect(order.mode).toBe("live");
    expect(order.order.order_id).toBe("klarna-order-1");
    expect(capture.mode).toBe("live");
    expect(capture.capture.capture_id).toBe("cap-1");
    expect(refund.mode).toBe("live");
    expect(refund.refund.refund_id).toBe("ref-1");
  });
});
