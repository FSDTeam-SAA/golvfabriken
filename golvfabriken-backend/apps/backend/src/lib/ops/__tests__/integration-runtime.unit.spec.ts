import {
  buildKlarnaSessionPreview,
  buildShippingQuotePreview,
  getIntegrationRuntimeReport,
} from "../integration-runtime";

describe("ops integration runtime", () => {
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
});
