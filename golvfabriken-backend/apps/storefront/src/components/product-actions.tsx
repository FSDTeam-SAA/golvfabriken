import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import ProductOptionSelect from "@/components/product-option-select"
import ProductPrice from "@/components/product-price"
import { Button } from "@/components/ui/button"
import { M2Calculator } from "@/components/m2-calculator"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { getVariantOptionsKeymap, isVariantInStock } from "@/lib/utils/product"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { getFlooringProductMetadata } from "@/lib/utils/product-metadata"
import { PackagesNeededOutput } from "@/lib/utils/packages-needed"
import { Minus, Plus } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useLocation } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { memo, useEffect, useMemo, useState } from "react"
import { useTranslation } from "@/lib/hooks/use-translation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct;
  region: HttpTypes.StoreRegion;
  disabled?: boolean;
};

const ProductActions = memo(function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const { t } = useTranslation()
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | undefined>
  >({})
  const [quantity, setQuantity] = useState(1)
  const [calcDetails, setCalcDetails] = useState<PackagesNeededOutput | null>(null)
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "dk"

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()

  useEffect(() => {
    setSelectedOptions({})
  }, [product?.handle])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    const variants = product?.variants
    if (variants?.length === 1) {
      const firstVariant = variants[0]
      const optionsKeymap = getVariantOptionsKeymap(
        firstVariant?.options ?? []
      )
      setSelectedOptions(optionsKeymap ?? {})
    }
  }, [product?.variants])

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product?.variants.length === 0) {
      return
    }

    // If there's only one variant and no options, select it directly
    if (
      product?.variants.length === 1 &&
      (!product?.options || product?.options.length === 0)
    ) {
      return product?.variants[0]
    }

    const variants = product?.variants
    if (!variants) return

    const variant = variants.find((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      const matches = isEqual(optionsKeymap, selectedOptions)

      return matches
    })

    return variant
  }, [product?.variants, product?.options, selectedOptions])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product?.variants?.some((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      return isEqual(optionsKeymap, selectedOptions)
    })
  }, [product?.variants, selectedOptions])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    if (!selectedVariant) {
      return false
    }

    return isVariantInStock(selectedVariant)
  }, [selectedVariant])

  // Flooring metadata
  const flooringMetadata = useMemo(() => {
    return getFlooringProductMetadata(
      product.metadata,
      selectedVariant?.metadata
    )
  }, [product.metadata, selectedVariant?.metadata])

  const isFlooring = Boolean(flooringMetadata.m2PerPackage && flooringMetadata.m2PerPackage > 0)

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || addToCartMutation.isPending) return null

    const metadata: Record<string, unknown> = isFlooring
      ? {
          is_flooring: true,
          m2_per_package: flooringMetadata.m2PerPackage,
          desired_m2: calcDetails?.desiredM2 || null,
          waste_pct: calcDetails?.wastePercentage || 10,
          total_m2_coverage: Number((quantity * (flooringMetadata.m2PerPackage || 1)).toFixed(2)),
          unit: "paket",
        }
      : {
          is_flooring: false,
        }

    // Immediately open cart drawer with optimistic feedback
    openCart()

    try {
      await addToCartMutation.mutateAsync({
        variant_id: selectedVariant.id,
        quantity: quantity,
        country_code: countryCode,
        metadata,
        product,
        variant: selectedVariant,
        region,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    }
  }

  // Handle calculator quantity update
  const handleQuantityFromCalculator = (qty: number, details?: PackagesNeededOutput | null) => {
    setQuantity(qty)
    if (details) {
      setCalcDetails(details)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <ProductPrice
        product={product}
        variant={selectedVariant}
        priceProps={{
          textSize: "large",
        }}
      />

      {/* If flooring product: show M² Calculator */}
      {isFlooring && (
        <M2Calculator
          m2PerPackage={flooringMetadata.m2PerPackage}
          defaultWastePercentage={flooringMetadata.wastePct}
          quantity={quantity}
          onQuantityChange={handleQuantityFromCalculator}
        />
      )}

      {/* If non-flooring product (Fallback): show standard quantity selector */}
      {!isFlooring && (
        <div className="flex items-center justify-between p-3.5 bg-golvfabriken-beige-50 border border-golvfabriken-beige-300 rounded-xl">
          <span className="text-sm font-semibold text-golvfabriken-graphite">
            {t('product.quantity')}
          </span>
          <div className="flex items-center gap-1 bg-white border border-golvfabriken-beige-300 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-md hover:bg-golvfabriken-beige-100 disabled:opacity-40 disabled:cursor-not-allowed text-golvfabriken-graphite flex items-center justify-center font-bold transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (!isNaN(val) && val > 0) setQuantity(val)
              }}
              className="w-12 text-center text-sm font-bold bg-transparent text-golvfabriken-graphite focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-md hover:bg-golvfabriken-beige-100 text-golvfabriken-graphite flex items-center justify-center font-bold transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => {
            return (
              <div key={option.id}>
                <ProductOptionSelect
                  option={option}
                  current={selectedOptions[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || addToCartMutation.isPending}
                />
              </div>
            )
          })}
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={!inStock || !selectedVariant || !!disabled || !isValidVariant || addToCartMutation.isPending}
        variant="primary"
        className="w-full relative py-3.5 text-base font-semibold transition-all duration-200"
        data-testid="add-product-button"
      >
        {addToCartMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t('product.addingToCart') || "Lägger till i varukorg..."}</span>
          </span>
        ) : !selectedVariant ? (
          t('product.selectVariant')
        ) : !inStock || !isValidVariant ? (
          t('product.outOfStock')
        ) : (
          t('product.addToCart')
        )}
      </Button>
    </div>
  )
})

export default ProductActions

