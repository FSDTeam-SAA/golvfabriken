// ============ PACKAGES NEEDED TYPES ============

export interface PackagesNeededInput {
  desiredM2: number | null // User input: m² to cover
  m2PerPackage: number | null // Product/variant m2_per_package
  wastePercentage: number // 0, 5, 10, or 15
}

export interface PackagesNeededOutput {
  desiredM2: number
  wastePercentage: number
  totalM2WithWaste: number // desiredM2 * (1 + wastePercentage/100)
  exactPackages: number // totalM2WithWaste / m2PerPackage (e.g. 2.72)
  packagesNeeded: number // Math.ceil(totalM2WithWaste / m2PerPackage) (e.g. 3)
  totalCoverageM2: number // packagesNeeded * m2PerPackage (e.g. 6.60)
  isValid: boolean // true if calculation succeeded
}

// ============ GET PACKAGES NEEDED ============

/**
 * Calculates the number of packages needed based on desired m², waste percentage, and package size.
 * 
 * Formula:
 * - totalM2WithWaste = desiredM2 × (1 + wastePercentage / 100)
 * - exactPackages = totalM2WithWaste / m2PerPackage
 * - packagesNeeded = Math.ceil(exactPackages) -> whole packages enforced
 * - totalCoverageM2 = packagesNeeded × m2PerPackage
 */
export function getPackagesNeeded(
  input: PackagesNeededInput
): PackagesNeededOutput | null {
  // Guard: desiredM2 is missing, null, zero, or negative
  if (!input.desiredM2 || input.desiredM2 <= 0 || !Number.isFinite(input.desiredM2)) {
    return null
  }

  // Guard: m2PerPackage is missing, null, zero, or negative
  if (!input.m2PerPackage || input.m2PerPackage <= 0 || !Number.isFinite(input.m2PerPackage)) {
    return null
  }

  const waste = typeof input.wastePercentage === "number" && input.wastePercentage >= 0 ? input.wastePercentage : 10

  try {
    const wasteMultiplier = 1 + waste / 100
    const totalM2WithWaste = input.desiredM2 * wasteMultiplier

    if (!isFinite(totalM2WithWaste) || isNaN(totalM2WithWaste)) {
      return null
    }

    const exactPackages = totalM2WithWaste / input.m2PerPackage
    const packagesNeeded = Math.ceil(exactPackages)

    if (!isFinite(packagesNeeded) || isNaN(packagesNeeded) || packagesNeeded <= 0) {
      return null
    }

    const totalCoverageM2 = Number((packagesNeeded * input.m2PerPackage).toFixed(2))

    return {
      desiredM2: input.desiredM2,
      wastePercentage: waste,
      totalM2WithWaste: Number(totalM2WithWaste.toFixed(2)),
      exactPackages: Number(exactPackages.toFixed(2)),
      packagesNeeded,
      totalCoverageM2,
      isValid: true,
    }
  } catch {
    return null
  }
}
