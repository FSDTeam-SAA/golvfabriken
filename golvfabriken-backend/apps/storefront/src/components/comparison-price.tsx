import { useTranslation } from "react-i18next"
import { ComparisonPriceOutput } from "@/lib/utils/comparison-price"

interface ComparisonPriceProps {
  comparisonPrice?: ComparisonPriceOutput | null
  className?: string
}

/**
 * Displays comparison price (price per m²) for flooring products.
 * 
 * Renders nothing if comparisonPrice is null or invalid.
 * Format: "Jmf: 226,82 kr/M2"
 * 
 * @param comparisonPrice - Pre-calculated comparison price from getProductComparisonPrice()
 * @param className - Optional Tailwind classes for styling
 * 
 * @example
 * ```tsx
 * <ComparisonPrice 
 *   comparisonPrice={getProductComparisonPrice(product, variant)}
 *   className="mt-1"
 * />
 * ```
 */
export function ComparisonPrice({
  comparisonPrice,
  className = "",
}: ComparisonPriceProps) {
  const { t } = useTranslation()

  // Hide if no valid comparison price
  if (!comparisonPrice?.formatted) {
    return null
  }

  return (
    <span className={`text-xs text-gray-600 ${className}`}>
      {t("comparison.prefix")}: {comparisonPrice.formatted}
    </span>
  )
}
