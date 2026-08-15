import {
  normalizeB2BCompanyCode,
  shouldAutoApproveB2BOrder,
} from "../b2b-runtime";

describe("ops b2b runtime", () => {
  it("normalizes company code", () => {
    expect(normalizeB2BCompanyCode("  ACME Group AB  ")).toBe("acme-group-ab");
  });

  it("auto approves when amount is below threshold", () => {
    expect(
      shouldAutoApproveB2BOrder({
        threshold: 10000,
        amountTotal: 7500,
      })
    ).toBe(true);
  });

  it("requires approval when amount is above threshold", () => {
    expect(
      shouldAutoApproveB2BOrder({
        threshold: 10000,
        amountTotal: 12000,
      })
    ).toBe(false);
  });
});
