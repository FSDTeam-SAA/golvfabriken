import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getPackagesNeeded, PackagesNeededOutput } from "@/lib/utils/packages-needed"
import { useFlooringCoverageQuote } from "@/lib/hooks/use-checkout"
import { Minus, Plus, InformationCircleSolid } from "@medusajs/icons"

interface M2CalculatorProps {
  m2PerPackage: number | null // From product/variant metadata
  defaultWastePercentage?: number | null
  quantity: number // Current whole package quantity
  onQuantityChange: (qty: number, calcDetails?: PackagesNeededOutput | null) => void // Callback
  className?: string
}

type CalculatorMode = 'direct' | 'dimensions'

const getValidWastePercentage = (value?: number | null) =>
  value !== undefined && value !== null && [0, 5, 10, 15].includes(value) ? value : 10

/**
 * M² Calculator Component
 * 
 * Interactive calculator for flooring products that determines the exact package requirement
 * and enforces rounding up to the nearest whole package.
 */
export function M2Calculator({
  m2PerPackage,
  defaultWastePercentage,
  quantity,
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
      if (!active) return

      setCalculation(fallbackResult)
      if (fallbackResult?.isValid && fallbackResult.packagesNeeded > 0) {
        onQuantityChange(fallbackResult.packagesNeeded, fallbackResult)
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
        if (!active) return

        const apiResult = response?.result
        if (apiResult?.is_valid) {
          const exact = Number((apiResult.total_m2_with_waste / apiResult.m2_per_package).toFixed(2))
          const totalCoverage = Number((apiResult.packages_needed * apiResult.m2_per_package).toFixed(2))
          const normalized: PackagesNeededOutput = {
            desiredM2: apiResult.desired_m2,
            wastePercentage: apiResult.waste_pct,
            totalM2WithWaste: apiResult.total_m2_with_waste,
            exactPackages: exact,
            packagesNeeded: apiResult.packages_needed,
            totalCoverageM2: totalCoverage,
            isValid: true,
          }
          setCalculation(normalized)
          if (normalized.packagesNeeded > 0) {
            onQuantityChange(normalized.packagesNeeded, normalized)
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

  const handleModeChange = (newMode: CalculatorMode) => {
    setMode(newMode)
    if (newMode === 'direct') {
      setLength(null)
      setWidth(null)
    } else {
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
    if ([0, 5, 10, 15].includes(value)) {
      setWastePercentage(value)
    }
  }

  const handleManualQuantityChange = (newQty: number) => {
    const wholeQty = Math.max(1, Math.floor(newQty))
    onQuantityChange(wholeQty, calculation)
  }

  // Hide calculator if m2PerPackage is missing or invalid
  if (!isCalculatorEnabled || !m2PerPackage) {
    return null
  }

  const totalCoverageWithCurrentQty = Number((quantity * m2PerPackage).toFixed(2))

  return (
    <div className={`border border-golvfabriken-beige-300 rounded-xl p-4 md:p-5 bg-golvfabriken-beige-50 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-golvfabriken-beige-200">
        <div>
          <h3 className="text-base md:text-lg font-bold text-golvfabriken-graphite flex items-center gap-1.5">
            {t("calculator.title")}
          </h3>
          <p className="text-xs text-golvfabriken-graphite/70">
            {t("calculator.packageSizeLabel")}: <span className="font-semibold text-golvfabriken-graphite">{m2PerPackage} m² / {t("calculator.unit")}</span>
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <fieldset className="mb-4">
        <legend className="sr-only">{t("calculator.modeLegend")}</legend>
        <div className="grid grid-cols-2 gap-1.5 bg-white border border-golvfabriken-beige-300 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleModeChange('direct')}
            className={`text-center py-2 px-3 text-xs md:text-sm rounded-md font-medium transition-all ${
              mode === 'direct'
                ? 'bg-golvfabriken-green text-white shadow-sm'
                : 'text-golvfabriken-graphite hover:bg-golvfabriken-beige-100'
            }`}
          >
            {t("calculator.modeDirect")}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('dimensions')}
            className={`text-center py-2 px-3 text-xs md:text-sm rounded-md font-medium transition-all ${
              mode === 'dimensions'
                ? 'bg-golvfabriken-green text-white shadow-sm'
                : 'text-golvfabriken-graphite hover:bg-golvfabriken-beige-100'
            }`}
          >
            {t("calculator.modeDimensions")}
          </button>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Direct mode - single m² input */}
        {mode === 'direct' && (
          <div>
            <label
              htmlFor="direct-m2"
              className="block text-xs font-semibold uppercase tracking-wider text-golvfabriken-graphite/80 mb-1"
            >
              {t("calculator.directLabel")}
            </label>
            <div className="relative">
              <input
                id="direct-m2"
                type="number"
                min="0.01"
                step="any"
                placeholder={t("calculator.directPlaceholder")}
                value={directM2 ?? ""}
                onChange={handleDirectM2Change}
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-golvfabriken-beige-300 rounded-lg text-sm text-golvfabriken-graphite focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-golvfabriken-graphite/60">
                m²
              </span>
            </div>
          </div>
        )}

        {/* Dimensions mode - length and width inputs */}
        {mode === 'dimensions' && (
          <>
            <div>
              <label
                htmlFor="length-input"
                className="block text-xs font-semibold uppercase tracking-wider text-golvfabriken-graphite/80 mb-1"
              >
                {t("calculator.lengthLabel")}
              </label>
              <div className="relative">
                <input
                  id="length-input"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder={t("calculator.lengthPlaceholder")}
                  value={length ?? ""}
                  onChange={handleLengthChange}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-golvfabriken-beige-300 rounded-lg text-sm text-golvfabriken-graphite focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-golvfabriken-graphite/60">
                  m
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="width-input"
                className="block text-xs font-semibold uppercase tracking-wider text-golvfabriken-graphite/80 mb-1"
              >
                {t("calculator.widthLabel")}
              </label>
              <div className="relative">
                <input
                  id="width-input"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder={t("calculator.widthPlaceholder")}
                  value={width ?? ""}
                  onChange={handleWidthChange}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-golvfabriken-beige-300 rounded-lg text-sm text-golvfabriken-graphite focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-golvfabriken-graphite/60">
                  m
                </span>
              </div>
            </div>
          </>
        )}

        {/* Waste percentage dropdown */}
        <div className={mode === 'direct' ? '' : 'sm:col-span-2'}>
          <label
            htmlFor="waste-percentage"
            className="block text-xs font-semibold uppercase tracking-wider text-golvfabriken-graphite/80 mb-1"
          >
            {t("calculator.wasteLabel")}
          </label>
          <select
            id="waste-percentage"
            value={wastePercentage}
            onChange={handleWasteChange}
            className="w-full px-3 py-2.5 bg-white border border-golvfabriken-beige-300 rounded-lg text-sm text-golvfabriken-graphite focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent font-medium"
          >
            <option value={0}>{t("calculator.waste0")}</option>
            <option value={5}>{t("calculator.waste5")}</option>
            <option value={10}>{t("calculator.waste10")}</option>
            <option value={15}>{t("calculator.waste15")}</option>
          </select>
        </div>
      </div>

      {/* Calculation breakdown */}
      {calculation?.isValid && (
        <div className="bg-white border border-golvfabriken-beige-300 rounded-lg p-3.5 space-y-2.5 mb-4">
          <div className="flex justify-between items-center text-xs text-golvfabriken-graphite/80">
            <span>{t("calculator.directLabel")}:</span>
            <span className="font-semibold text-golvfabriken-graphite">{calculation.desiredM2.toFixed(2)} m²</span>
          </div>

          <div className="flex justify-between items-center text-xs text-golvfabriken-graphite/80">
            <span>{t("calculator.totalM2WithWaste")} (+{calculation.wastePercentage}%):</span>
            <span className="font-semibold text-golvfabriken-graphite">{calculation.totalM2WithWaste.toFixed(2)} m²</span>
          </div>

          {calculation.exactPackages !== calculation.packagesNeeded && (
            <div className="flex justify-between items-center text-xs text-golvfabriken-graphite/70 pt-1 border-t border-golvfabriken-beige-200">
              <span>{t("calculator.exactCalculated")}:</span>
              <span className="font-mono text-zinc-600">{calculation.exactPackages} {t("calculator.unit")}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-golvfabriken-beige-300">
            <div>
              <span className="text-sm font-bold text-golvfabriken-graphite block">
                {t("calculator.packagesNeeded")}:
              </span>
              <span className="text-[11px] text-golvfabriken-graphite/60 flex items-center gap-1 mt-0.5">
                <InformationCircleSolid className="w-3.5 h-3.5 text-golvfabriken-green shrink-0" />
                {t("calculator.wholePackagesNote")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-golvfabriken-green">
                {calculation.packagesNeeded} {t("calculator.unit")}
              </span>
            </div>
          </div>

          <div className="bg-golvfabriken-green/5 border border-golvfabriken-green/20 rounded-md p-2 text-xs text-golvfabriken-green font-medium flex justify-between items-center">
            <span>{t("calculator.actualCoverage")}:</span>
            <span className="font-bold">{calculation.totalCoverageM2.toFixed(2)} m²</span>
          </div>
        </div>
      )}

      {/* Package Quantity Adjuster (always whole integer packages) */}
      <div className="bg-white border border-golvfabriken-beige-300 rounded-lg p-3 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-golvfabriken-graphite block">
            {t("calculator.packageStepperLabel")}
          </span>
          <span className="text-xs text-golvfabriken-graphite/60">
            {t("cart.coverage", { sqm: totalCoverageWithCurrentQty })}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-golvfabriken-beige-100 rounded-lg p-1 border border-golvfabriken-beige-300">
          <button
            type="button"
            onClick={() => handleManualQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-md bg-white hover:bg-golvfabriken-beige-200 disabled:opacity-40 disabled:cursor-not-allowed text-golvfabriken-graphite flex items-center justify-center font-bold shadow-xs transition-colors"
            aria-label="Decrease packages"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (!isNaN(val) && val > 0) {
                handleManualQuantityChange(val)
              }
            }}
            className="w-12 text-center text-sm font-bold bg-transparent text-golvfabriken-graphite focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleManualQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded-md bg-white hover:bg-golvfabriken-beige-200 text-golvfabriken-graphite flex items-center justify-center font-bold shadow-xs transition-colors"
            aria-label="Increase packages"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

