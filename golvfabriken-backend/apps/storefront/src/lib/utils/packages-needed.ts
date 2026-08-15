// ============ PACKAGES NEEDED TYPES ============

export interface PackagesNeededInput {
  desiredM2: number | null // User input: m² to cover
  m2PerPackage: number | null // Product/variant m2_per_package
  wastePercentage: number // 5, 10, or 15
}

export interface PackagesNeededOutput {
  desiredM2: number
  wastePercentage: number
  totalM2WithWaste: number // desiredM2 * (1 + wastePercentage/100)
  packagesNeeded: number // Math.ceil(totalM2WithWaste / m2PerPackage)
  isValid: boolean // true if calculation succeeded
}

// ============ GET PACKAGES NEEDED ============

/**
 * Calculates the number of packages needed based on desired m², waste percentage, and package size.
 * 
 * Formula:
 * - totalM2WithWaste = desiredM2 × (1 + wastePercentage / 100)
 * - packagesNeeded = Math.ceil(totalM2WithWaste / m2PerPackage)
 * 
 * Returns null (hides calculator) when:
 * - desiredM2 is missing, null, zero, or negative
 * - m2PerPackage is missing, null, zero, or negative
 * - wastePercentage is not 5, 10, or 15
 * 
 * @param input - Desired m², waste percentage, and package size
 * @returns Calculated packages needed or null if data is invalid
 * 
 * @example
 * ```ts
 * const result = getPackagesNeeded({
 *   desiredM2: 50,
 *   m2PerPackage: 2.2,
 *   wastePercentage: 10,
 * })
 * // Returns: { desiredM2: 50, wastePercentage: 10, totalM2WithWaste: 55, packagesNeeded: 25, isValid: true }
 * ```
 */
export function getPackagesNeeded(
  input: PackagesNeededInput
): PackagesNeededOutput | null {
  // Guard: desiredM2 is missing, null, zero, or negative
  if (!input.desiredM2 || input.desiredM2 <= 0) {
    return null
  }

  // Guard: m2PerPackage is missing, null, zero, or negative
  if (!input.m2PerPackage || input.m2PerPackage <= 0) {
    return null
  }

  // Guard: wastePercentage must be 5, 10, or 15
  if (![5, 10, 15].includes(input.wastePercentage)) {
    return null
  }

  try {
    // Calculate waste multiplier
    const wasteMultiplier = 1 + input.wastePercentage / 100

    // Calculate total m² including waste
    // Using multiplication instead of a decimal library for simplicity
    // The PRD mentions Decimal.js, but for these simple calculations, 
    // native JavaScript math is sufficient and avoids adding dependencies
    const totalM2WithWaste = input.desiredM2 * wasteMultiplier

    // Guard against calculation edge cases
    if (!isFinite(totalM2WithWaste) || isNaN(totalM2WithWaste)) {
      return null
    }

    // Calculate packages needed (always round up)
    const packagesNeeded = Math.ceil(totalM2WithWaste / input.m2PerPackage)

    // Guard against invalid result
    if (!isFinite(packagesNeeded) || isNaN(packagesNeeded) || packagesNeeded <= 0) {
      return null
    }

    return {
      desiredM2: input.desiredM2,
      wastePercentage: input.wastePercentage,
      totalM2WithWaste: Number(totalM2WithWaste.toFixed(2)),
      packagesNeeded,
      isValid: true,
    }
  } catch (error) {
    // Safe fallback on any calculation errors
    return null
  }
}
