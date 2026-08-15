import { parseCsvContent, validateProductCatalogCsv } from "../csv-import";

describe("ops csv import parser", () => {
  it("parses csv rows and headers", () => {
    const content = [
      "handle,title,sku,price,currency_code",
      "oak-floor,Oak Floor,SKU-001,599,SEK",
      "pine-floor,Pine Floor,SKU-002,499,SEK",
    ].join("\n");
    const parsed = parseCsvContent(content);

    expect(parsed.headers).toEqual([
      "handle",
      "title",
      "sku",
      "price",
      "currency_code",
    ]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].handle).toBe("oak-floor");
  });

  it("detects validation errors", () => {
    const content = [
      "handle,title,sku,price,currency_code",
      "oak-floor,Oak Floor,SKU-001,abc,SEK",
      "oak-floor,Oak Floor Duplicate,SKU-001,499,SEK",
    ].join("\n");
    const parsed = parseCsvContent(content);
    const validation = validateProductCatalogCsv(parsed.rows, parsed.headers);

    expect(validation.ok).toBe(false);
    expect(validation.invalidRows).toBeGreaterThan(0);
    expect(validation.issues.some((issue) => issue.code === "INVALID_NUMBER")).toBe(true);
    expect(validation.issues.some((issue) => issue.code === "DUPLICATE_HANDLE")).toBe(true);
    expect(validation.issues.some((issue) => issue.code === "DUPLICATE_SKU")).toBe(true);
  });
});
