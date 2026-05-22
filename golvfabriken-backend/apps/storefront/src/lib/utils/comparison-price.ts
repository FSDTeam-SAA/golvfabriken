import { HttpTypes } from "@medusajs/types"
import { getFlooringProductMetadata } from "@/lib/utils/product-metadata"

// ============ COMPARISON PRICE TYPES ============

export interface ComparisonPriceInput {
  price: number // Active price in whole units (e.g., 499 for 499 kr)
  currencyCode: string // e.g., "SEK"
  m2PerPackage: number | null // e.g., 2.2
  unit: string // e.g., "M2"
  locale?: string // e.g., "sv-SE"
}

export interface ComparisonPriceOutput {
  value: number | null // e.g., 226.82
  formatted: string | null // e.g., "226,82 kr/M2"
  unit: string // e.g., "M2"
}

// ============ GET COMPARISON PRICE ============

/**
 * Calculates price per square meter (m²) for flooring products.
 * 
 * Calculation: price / m2_per_package
 * 
 * Returns null (hides display) when:
 * - m2PerPackage is missing, null, zero, negative, or non-numeric
 * - price is missing, invalid, or zero
 * 
 * @param input - Price, currency, m2 per package, and formatting options
 * @returns Formatted comparison price or null if data is invalid
 * 
 * @example
 * ```ts
 * const result = getComparisonPrice({
 *   price: 499,
 *   currencyCode: "SEK",
 *   m2PerPackage: 2.2,
 *   unit: "M2",
 * })
 * // Returns: { value: 226.82, formatted: "226,82 kr/M2", unit: "M2" }
 * ```
 */
export function getComparisonPrice(
  input: ComparisonPriceInput
): ComparisonPriceOutput {
  const {
    price,
    currencyCode,
    m2PerPackage,
    unit,
    locale = "sv-SE",
  } = input

  // Guard: invalid m2PerPackage
  if (
    !m2PerPackage ||
    typeof m2PerPackage !== "number" ||
    m2PerPackage <= 0 ||
    !isFinite(m2PerPackage)
  ) {
    return { value: null, formatted: null, unit }
  }

  // Guard: invalid price
  if (
    !price ||
    typeof price !== "number" ||
    price <= 0 ||
    !isFinite(price)
  ) {
    return { value: null, formatted: null, unit }
  }

  try {
    // Calculate: price per m²
    const value = price / m2PerPackage

    // Guard against calculation edge cases
    if (!isFinite(value) || isNaN(value)) {
      return { value: null, formatted: null, unit }
    }

    // Format Swedish: 226,82 kr/M2
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

    const formatted = `${formattedNumber} kr/${unit}`

    return { value, formatted, unit }
  } catch (error) {
    // Safe fallback on any formatting errors
    return { value: null, formatted: null, unit }
  }
}

// ============ EXTRACT M2 FROM METADATA ============

/**
 * Safely extracts m2_per_package from product or variant metadata.
 * 
 * Priority: variant metadata > product metadata > null
 * 
 * @param productMetadata - Product-level metadata
 * @param variantMetadata - Variant-level metadata (optional, overrides product)
 * @returns m2_per_package as number or null
 */
export function getM2PerPackage(
  productMetadata?: Record<string, unknown> | null,
  variantMetadata?: Record<string, unknown> | null
): number | null {
  return getFlooringProductMetadata(
    productMetadata,
    variantMetadata
  ).m2PerPackage
}

// ============ GET COMPARISON PRICE FOR PRODUCT ============

/**
 * Convenience function to get comparison price from a Medusa product/variant.
 * Automatically resolves active price and m2_per_package from metadata.
 * 
 * @param product - Medusa product
 * @param variant - Selected variant (optional, uses first variant if not provided)
 * @returns ComparisonPriceOutput
 */
export function getProductComparisonPrice(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant
): ComparisonPriceOutput {
  const unit = "M2"

  // Use provided variant or first variant
  const targetVariant = variant ?? product.variants?.[0]

  if (!targetVariant) {
    return { value: null, formatted: null, unit }
  }

  // Get active price from variant's calculated_price
  const calculatedPrice = targetVariant.calculated_price
  const price = calculatedPrice?.calculated_amount

  if (!price || !calculatedPrice.currency_code) {
    return { value: null, formatted: null, unit }
  }

  // Get m2_per_package (variant metadata overrides product metadata)
  const m2PerPackage = getM2PerPackage(
    product.metadata,
    targetVariant.metadata
  )

  return getComparisonPrice({
    price,
    currencyCode: calculatedPrice.currency_code,
    m2PerPackage,
    unit,
  })
}
