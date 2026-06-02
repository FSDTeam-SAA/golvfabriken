export type FlooringCoverageInput = {
  desired_m2?: number;
  length_m?: number;
  width_m?: number;
  m2_per_package?: number;
  waste_pct?: number;
};

export type FlooringCoverageResult = {
  desired_m2: number;
  waste_pct: number;
  total_m2_with_waste: number;
  m2_per_package: number;
  packages_needed: number;
  is_valid: boolean;
  mode: "direct" | "dimensions";
  note?: string;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : NaN;
};

const normalizeWastePct = (value: unknown) => {
  const numeric = Math.round(toNumber(value));

  if ([5, 10, 15].includes(numeric)) {
    return numeric;
  }

  return 10;
};

const roundTo = (value: number, digits: number) => {
  const factor = Math.pow(10, digits);

  return Math.round(value * factor) / factor;
};

export const calculateFlooringCoverage = (
  input: FlooringCoverageInput
): FlooringCoverageResult => {
  const m2PerPackage = toNumber(input.m2_per_package);
  const wastePct = normalizeWastePct(input.waste_pct);
  const directDesiredM2 = toNumber(input.desired_m2);
  const lengthM = toNumber(input.length_m);
  const widthM = toNumber(input.width_m);
  const dimensionsArea =
    Number.isFinite(lengthM) && lengthM > 0 && Number.isFinite(widthM) && widthM > 0
      ? lengthM * widthM
      : NaN;
  const desiredM2 = Number.isFinite(directDesiredM2) && directDesiredM2 > 0
    ? directDesiredM2
    : dimensionsArea;
  const mode: "direct" | "dimensions" =
    Number.isFinite(directDesiredM2) && directDesiredM2 > 0 ? "direct" : "dimensions";

  if (!Number.isFinite(m2PerPackage) || m2PerPackage <= 0) {
    return {
      desired_m2: Number.isFinite(desiredM2) ? roundTo(desiredM2, 4) : 0,
      waste_pct: wastePct,
      total_m2_with_waste: 0,
      m2_per_package: 0,
      packages_needed: 0,
      is_valid: false,
      mode,
      note: "INVALID_M2_PER_PACKAGE",
    };
  }

  if (!Number.isFinite(desiredM2) || desiredM2 <= 0) {
    return {
      desired_m2: 0,
      waste_pct: wastePct,
      total_m2_with_waste: 0,
      m2_per_package: roundTo(m2PerPackage, 4),
      packages_needed: 0,
      is_valid: false,
      mode,
      note: "INVALID_DESIRED_M2",
    };
  }

  const totalM2WithWaste = desiredM2 * (1 + wastePct / 100);
  const packagesNeeded = Math.ceil(totalM2WithWaste / m2PerPackage);

  if (!Number.isFinite(packagesNeeded) || packagesNeeded <= 0) {
    return {
      desired_m2: roundTo(desiredM2, 4),
      waste_pct: wastePct,
      total_m2_with_waste: 0,
      m2_per_package: roundTo(m2PerPackage, 4),
      packages_needed: 0,
      is_valid: false,
      mode,
      note: "INVALID_PACKAGE_RESULT",
    };
  }

  return {
    desired_m2: roundTo(desiredM2, 4),
    waste_pct: wastePct,
    total_m2_with_waste: roundTo(totalM2WithWaste, 4),
    m2_per_package: roundTo(m2PerPackage, 4),
    packages_needed: packagesNeeded,
    is_valid: true,
    mode,
  };
};
