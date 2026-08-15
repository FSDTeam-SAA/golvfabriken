import {
  buildTaxQuote,
  pickBestTaxConfiguration,
  shouldApplyReverseCharge,
} from "../tax-runtime";

describe("ops tax runtime", () => {
  it("picks active country configuration", () => {
    const matched = pickBestTaxConfiguration({
      destinationCountry: "SE",
      configurations: [
        {
          id: "taxcfg_draft",
          country_code: "SE",
          vat_rate: 0.25,
          status: "draft",
        },
        {
          id: "taxcfg_active",
          country_code: "SE",
          vat_rate: 0.25,
          status: "active",
        },
      ],
    });

    expect(matched?.id).toBe("taxcfg_active");
  });

  it("applies reverse charge for EU B2B cross-border with VAT ID", () => {
    const applies = shouldApplyReverseCharge({
      customerType: "b2b",
      customerVatId: "DE123456789",
      destinationCountry: "DE",
      merchantCountryCode: "SE",
      reverseChargeEnabled: true,
    });

    expect(applies).toBe(true);
  });

  it("builds inclusive VAT quote correctly", () => {
    const quote = buildTaxQuote({
      input: {
        destination_country: "SE",
        customer_type: "b2c",
        currency_code: "SEK",
        lines: [
          {
            sku: "SKU-1",
            quantity: 2,
            unit_price: 125,
          },
        ],
      },
      matchedConfiguration: {
        id: "taxcfg_1",
        country_code: "SE",
        vat_rate: 0.25,
        is_tax_inclusive: true,
        status: "active",
      },
    });

    expect(quote.source.is_tax_inclusive).toBe(true);
    expect(quote.totals.net_amount).toBe(200);
    expect(quote.totals.tax_amount).toBe(50);
    expect(quote.totals.gross_amount).toBe(250);
  });
});
