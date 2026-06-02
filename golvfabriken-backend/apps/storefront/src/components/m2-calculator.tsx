import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getPackagesNeeded, PackagesNeededOutput } from "@/lib/utils/packages-needed"
import { useFlooringCoverageQuote } from "@/lib/hooks/use-checkout"

interface M2CalculatorProps {
  m2PerPackage: number | null // From product/variant metadata
  defaultWastePercentage?: number | null
  onQuantityChange: (qty: number) => void // Callback to update quantity field
  className?: string
}

type CalculatorMode = 'direct' | 'dimensions'

const getValidWastePercentage = (value?: number | null) =>
  value && [5, 10, 15].includes(value) ? value : 10

/**
 * M² Calculator Component
 * 
 * Interactive calculator that helps customers determine how many packages they need
 * based on desired coverage area and waste percentage.
 * 
 * Features:
 * - Two input modes: direct area or length × width dimensions
 * - User selects waste percentage (5%, 10%, 15% - default 10%)
 * - Real-time calculation (no debounce needed)
 * - Automatically updates parent quantity field via callback
 * - Hides when m2PerPackage is missing or invalid
 * - Recalculates when m2PerPackage changes (variant switch)
 * 
 * @param m2PerPackage - Package size from product/variant metadata
 * @param onQuantityChange - Callback to update parent quantity field
 * @param className - Optional Tailwind classes
 * 
 * @example
 * ```tsx
 * <M2Calculator
 *   m2PerPackage={selectedVariant?.metadata?.m2_per_package}
 *   onQuantityChange={(qty) => setQuantity(qty)}
 * />
 * ```
 */
export function M2Calculator({
  m2PerPackage,
  defaultWastePercentage,
  onQuantityChange,
  className = "",
}: M2CalculatorProps) {
  const { t } = useTranslation()
  const flooringCoverageMutation = useFlooringCoverageQuote()
  const requestCoverage = flooringCoverageMutation.mutateAsync
  
  // Mode state
  const [mode, setMode] = useState<CalculatorMode>('direct')
  
  // Input states
  const [directM2, setDirectM2] = useState<number | null>(null)
  const [length, setLength] = useState<number | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  const [wastePercentage, setWastePercentage] = useState(() =>
    getValidWastePercentage(defaultWastePercentage)
  )
  
  // Calculation result
  const [calculation, setCalculation] = useState<PackagesNeededOutput | null>(null)
  const isCalculatorEnabled = !!m2PerPackage && m2PerPackage > 0

  // Derive desiredM2 based on current mode
  const desiredM2 = mode === 'direct'
    ? (directM2 && directM2 > 0 ? directM2 : null)
    : (length && width && length > 0 && width > 0 ? length * width : null)

  // Recalculate whenever inputs change
  useEffect(() => {
    let active = true

    if (!isCalculatorEnabled) {
      setCalculation(null)
      return
    }

    const fallbackResult = getPackagesNeeded({
      desiredM2,
      m2PerPackage,
      wastePercentage,
    })

    const useFallback = () => {
      if (!active) {
        return
      }

      setCalculation(fallbackResult)
      if (fallbackResult?.isValid && fallbackResult.packagesNeeded > 0) {
        onQuantityChange(fallbackResult.packagesNeeded)
      }
    }

    if (!fallbackResult?.isValid || !desiredM2 || !m2PerPackage) {
      useFallback()
      return
    }

    requestCoverage({
        desired_m2: desiredM2,
        m2_per_package: m2PerPackage,
        waste_pct: wastePercentage,
      })
      .then((response) => {
        if (!active) {
          return
        }

        const apiResult = response?.result
        if (apiResult?.is_valid) {
          const normalized: PackagesNeededOutput = {
            desiredM2: apiResult.desired_m2,
            wastePercentage: apiResult.waste_pct,
            totalM2WithWaste: apiResult.total_m2_with_waste,
            packagesNeeded: apiResult.packages_needed,
            isValid: true,
          }
          setCalculation(normalized)
          if (normalized.packagesNeeded > 0) {
            onQuantityChange(normalized.packagesNeeded)
          }
          return
        }

        useFallback()
      })
      .catch(() => {
        useFallback()
      })

    return () => {
      active = false
    }
  }, [desiredM2, wastePercentage, m2PerPackage, onQuantityChange, isCalculatorEnabled, requestCoverage])

  useEffect(() => {
    setWastePercentage(getValidWastePercentage(defaultWastePercentage))
  }, [defaultWastePercentage])

  // Mode switch handler - reset other mode's fields
  const handleModeChange = (newMode: CalculatorMode) => {
    setMode(newMode)
    if (newMode === 'direct') {
      // Switching to direct mode - clear dimensions
      setLength(null)
      setWidth(null)
    } else {
      // Switching to dimensions mode - clear direct input
      setDirectM2(null)
    }
  }

  const handleDirectM2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setDirectM2(null)
      return
    }
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setDirectM2(parsed)
    }
  }

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setLength(null)
      return
    }
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setLength(parsed)
    }
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setWidth(null)
      return
    }
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setWidth(parsed)
    }
  }

  const handleWasteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value)
    if ([5, 10, 15].includes(value)) {
      setWastePercentage(value)
    }
  }

  // Hide calculator if m2PerPackage is missing or invalid
  if (!isCalculatorEnabled) {
    return null
  }

  return (
    <div className={`border border-golvfabriken-beige-300 rounded-lg p-4 bg-golvfabriken-beige-50 ${className}`}>
      <h3 className="text-lg font-semibold text-golvfabriken-graphite mb-4">
        {t("calculator.title")}
      </h3>

      {/* Mode Toggle */}
      <fieldset className="mb-4">
        <legend className="sr-only">{t("calculator.modeLegend")}</legend>
        <div className="flex gap-2 bg-white border border-golvfabriken-beige-300 rounded-md p-1">
          <label
            className={`flex-1 text-center px-4 py-2 rounded cursor-pointer transition-colors ${
              mode === 'direct'
                ? 'bg-golvfabriken-green text-white font-medium'
                : 'text-golvfabriken-graphite hover:bg-golvfabriken-beige-100'
            }`}
          >
            <input
              type="radio"
              name="calc-mode"
              value="direct"
              checked={mode === 'direct'}
              onChange={() => handleModeChange('direct')}
              className="sr-only"
            />
            {t("calculator.modeDirect")}
          </label>
          <label
            className={`flex-1 text-center px-4 py-2 rounded cursor-pointer transition-colors ${
              mode === 'dimensions'
                ? 'bg-golvfabriken-green text-white font-medium'
                : 'text-golvfabriken-graphite hover:bg-golvfabriken-beige-100'
            }`}
          >
            <input
              type="radio"
              name="calc-mode"
              value="dimensions"
              checked={mode === 'dimensions'}
              onChange={() => handleModeChange('dimensions')}
              className="sr-only"
            />
            {t("calculator.modeDimensions")}
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Direct mode - single m² input */}
        {mode === 'direct' && (
          <div>
            <label
              htmlFor="direct-m2"
              className="block text-sm font-medium text-golvfabriken-graphite mb-1"
            >
              {t("calculator.directLabel")}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="direct-m2"
                type="number"
                min="0.01"
                step="0.01"
                placeholder={t("calculator.directPlaceholder")}
                value={directM2 ?? ""}
                onChange={handleDirectM2Change}
                className="w-full px-3 py-2 border border-golvfabriken-beige-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent"
              />
              <span className="text-sm text-golvfabriken-graphite whitespace-nowrap">m²</span>
            </div>
          </div>
        )}

        {/* Dimensions mode - length and width inputs */}
        {mode === 'dimensions' && (
          <>
            <div>
              <label
                htmlFor="length-input"
                className="block text-sm font-medium text-golvfabriken-graphite mb-1"
              >
                {t("calculator.lengthLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="length-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={t("calculator.lengthPlaceholder")}
                  value={length ?? ""}
                  onChange={handleLengthChange}
                  className="w-full px-3 py-2 border border-golvfabriken-beige-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent"
                />
                <span className="text-sm text-golvfabriken-graphite">m</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="width-input"
                className="block text-sm font-medium text-golvfabriken-graphite mb-1"
              >
                {t("calculator.widthLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="width-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={t("calculator.widthPlaceholder")}
                  value={width ?? ""}
                  onChange={handleWidthChange}
                  className="w-full px-3 py-2 border border-golvfabriken-beige-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent"
                />
                <span className="text-sm text-golvfabriken-graphite">m</span>
              </div>
            </div>
          </>
        )}

        {/* Waste percentage dropdown - always visible */}
        <div className={mode === 'direct' ? '' : 'sm:col-span-2'}>
          <label
            htmlFor="waste-percentage"
            className="block text-sm font-medium text-golvfabriken-graphite mb-1"
          >
            {t("calculator.wasteLabel")}
          </label>
          <select
            id="waste-percentage"
            value={wastePercentage}
            onChange={handleWasteChange}
            className="w-full px-3 py-2 border border-golvfabriken-beige-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent"
          >
            <option value={5}>{t("calculator.waste5")}</option>
            <option value={10}>{t("calculator.waste10")}</option>
            <option value={15}>{t("calculator.waste15")}</option>
          </select>
        </div>
      </div>

      {/* Calculation results */}
      {calculation?.isValid && (
        <div className="bg-white border border-golvfabriken-beige-300 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-golvfabriken-graphite/70">
              {t("calculator.totalM2WithWaste")}:
            </span>
            <span className="font-medium text-golvfabriken-graphite">
              {calculation.totalM2WithWaste.toFixed(2)} m²
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-golvfabriken-beige-200">
            <span className="text-sm font-semibold text-golvfabriken-graphite">
              {t("calculator.packagesNeeded")}:
            </span>
            <span className="text-lg font-bold text-golvfabriken-green">
              {calculation.packagesNeeded} {t("calculator.unit")}
            </span>
          </div>
          <p className="text-xs text-golvfabriken-graphite/60 pt-1">
            {t("calculator.helpText", { wastePercentage: calculation.wastePercentage })}
          </p>
        </div>
      )}

      {/* Empty state message - mode-specific */}
      {!calculation?.isValid && desiredM2 === null && (
        <p className="text-sm text-golvfabriken-graphite/60 text-center py-3">
          {mode === 'direct' 
            ? t("calculator.directMissingMessage") 
            : t("calculator.dimensionsMissingMessage")}
        </p>
      )}

      {/* Invalid input message */}
      {!calculation?.isValid && desiredM2 !== null && desiredM2 <= 0 && (
        <p className="text-sm text-red-600 text-center py-3">
          {t("calculator.invalidMessage")}
        </p>
      )}
    </div>
  )
}
