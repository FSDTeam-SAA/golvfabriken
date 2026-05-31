import {
  anonymizeEmail,
  anonymizeIdentifier,
  normalizeEmail,
} from "../privacy-runtime";

describe("ops privacy runtime", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  TEST@Example.COM ")).toBe("test@example.com");
  });

  it("anonymizes identifier deterministically", () => {
    const a = anonymizeIdentifier("Customer-123", "cust", "test-salt");
    const b = anonymizeIdentifier("Customer-123", "cust", "test-salt");

    expect(a).toBe(b);
    expect(a.startsWith("cust_")).toBe(true);
  });

  it("anonymizes email to redacted domain", () => {
    const anonymized = anonymizeEmail("user@example.com", "test-salt");

    expect(anonymized.endsWith("@redacted.local")).toBe(true);
    expect(anonymized).not.toContain("user@example.com");
  });
});
