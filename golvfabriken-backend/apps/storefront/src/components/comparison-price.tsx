import { useTranslation } from "react-i18next"
import { ComparisonPriceOutput } from "@/lib/utils/comparison-price"

interface ComparisonPriceProps {
  comparisonPrice?: ComparisonPriceOutput | null
  className?: string
  layout?: "inline" | "stacked" | "badge"
}

/**
 * Displays comparison price (price per m²) for flooring products.
 * 
 * Renders nothing if comparisonPrice is null or invalid.
 * Format: "226,82 kr/m²" or "Jmf: 226,82 kr/m²"
 */
export function ComparisonPrice({
  comparisonPrice,
  className = "",
  layout = "stacked",
}: ComparisonPriceProps) {
  const { t } = useTranslation()

  // Hide if no valid comparison price
  if (!comparisonPrice?.formatted) {
    return null
  }

  if (layout === "badge") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-golvfabriken-green/10 text-golvfabriken-green ${className}`}>
        {comparisonPrice.formatted}
      </span>
    )
  }

  return (
    <div className={`flex items-baseline gap-1.5 text-sm font-medium text-golvfabriken-green ${className}`}>
      <span className="text-xs text-golvfabriken-graphite/60">{t("comparison.prefix")}:</span>
      <span className="font-semibold">{comparisonPrice.formatted}</span>
    </div>
  )
}

