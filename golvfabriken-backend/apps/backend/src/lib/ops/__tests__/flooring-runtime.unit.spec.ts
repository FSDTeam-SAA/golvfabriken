import { calculateFlooringCoverage } from "../flooring-runtime";

describe("flooring runtime", () => {
  it("calculates packages from direct m2 input", () => {
    const result = calculateFlooringCoverage({
      desired_m2: 50,
      m2_per_package: 2.2,
      waste_pct: 10,
    });

    expect(result.is_valid).toBe(true);
    expect(result.mode).toBe("direct");
    expect(result.total_m2_with_waste).toBe(55);
    expect(result.packages_needed).toBe(25);
  });

  it("calculates packages from dimensions input when direct m2 is missing", () => {
    const result = calculateFlooringCoverage({
      length_m: 10,
      width_m: 4,
      m2_per_package: 2.2,
      waste_pct: 5,
    });

    expect(result.is_valid).toBe(true);
    expect(result.mode).toBe("dimensions");
    expect(result.desired_m2).toBe(40);
    expect(result.total_m2_with_waste).toBe(42);
    expect(result.packages_needed).toBe(20);
  });

  it("returns invalid result for missing m2_per_package", () => {
    const result = calculateFlooringCoverage({
      desired_m2: 20,
      waste_pct: 10,
    });

    expect(result.is_valid).toBe(false);
    expect(result.note).toBe("INVALID_M2_PER_PACKAGE");
  });
});
