import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Price } from "@/components/ui/price"
import { Thumbnail } from "@/components/ui/thumbnail"
import {
  useCart,
  useDeleteLineItem,
  useUpdateLineItem,
  useApplyPromoCode,
  useRemovePromoCode,
} from "@/lib/hooks/use-cart"
import { sortCartItems } from "@/lib/utils/cart"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { getPricePercentageDiff } from "@/lib/utils/price"
import { useCartDrawer } from "@/lib/context/cart"
import { Minus, Plus, Trash, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"
import { clsx } from "clsx"
import { useState } from "react"
import { useTranslation } from "@/lib/hooks/use-translation"


type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  className?: string
}

export const LineItemPrice = ({ item, currencyCode, className }: LineItemPriceProps) => {
  const { total, original_total } = item
  const originalPrice = original_total
  const currentPrice = total
  const hasReducedPrice = currentPrice && originalPrice && currentPrice < originalPrice

  return (
    <Price
      price={currentPrice || 0}
      currencyCode={currencyCode}
      originalPrice={
        hasReducedPrice
          ? {
              price: originalPrice || 0,
              percentage: getPricePercentageDiff(originalPrice || 0, currentPrice || 0),
            }
          : undefined
      }
      className={className}
    />
  )
}


type CartDeleteItemProps = {
  item: HttpTypes.StoreCartLineItem
  fields?: string
}

export const CartDeleteItem = ({ item, fields }: CartDeleteItemProps) => {
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  return (
    <Button
      onClick={() => deleteLineItemMutation.mutate({ line_id: item.id })}
      disabled={deleteLineItemMutation.isPending}
      className="text-zinc-600 hover:text-zinc-500 transition-colors ml-2"
      variant="transparent"
      size="fit"
    >
      <Trash />
    </Button>
  )
}


type CartItemQuantitySelectorProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "default" | "compact"
  fields?: string
}

export const CartItemQuantitySelector = ({
  item,
  type = "default",
  fields,
}: CartItemQuantitySelectorProps) => {
  const updateLineItemMutation = useUpdateLineItem({ fields })
  const deleteLineItemMutation = useDeleteLineItem({ fields })

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      deleteLineItemMutation.mutate({ line_id: item.id })
    } else {
      updateLineItemMutation.mutate({
        line_id: item.id,
        quantity: newQuantity,
      })
    }
  }

  return (
    <div className="flex items-center">
      <Button
        onClick={() => handleQuantityChange(item.quantity - 1)}
        className={clsx(
          type === "compact" &&
            "text-zinc-600 hover:text-zinc-500 transition-colors p-1 ml-2"
        )}
        variant="transparent"
        size="fit"
      >
        <Minus />
      </Button>
      <span
        className={clsx(
          type === "compact"
            ? "text-sm text-zinc-900 text-center px-3"
            : "text-center text-sm px-6"
        )}
      >
        {item.quantity}
      </span>
      <Button
        onClick={() => handleQuantityChange(item.quantity + 1)}
        className={clsx(
          type === "compact" &&
            "text-zinc-600 hover:text-zinc-500 transition-colors p-1 ml-2"
        )}
        variant="transparent"
        size="fit"
      >
        <Plus />
      </Button>
    </div>
  )
}


interface CartLineItemProps {
  item: HttpTypes.StoreCartLineItem
  cart: HttpTypes.StoreCart
  type?: "default" | "compact" | "display"
  fields?: string
  className?: string
}

const getLineItemFlooringData = (item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem) => {
  const m2PerPackage = Number(
    item.metadata?.m2_per_package ??
    item.variant?.metadata?.m2_per_package ??
    item.product?.metadata?.m2_per_package ??
    (item as any).variant?.product?.metadata?.m2_per_package ??
    0
  )
  const isFlooring = m2PerPackage > 0
  const totalCoverage = isFlooring ? Number((item.quantity * m2PerPackage).toFixed(2)) : null
  const unitPrice = item.unit_price || (item.total && item.quantity ? item.total / item.quantity : 0)
  const pricePerM2 = isFlooring && unitPrice ? unitPrice / m2PerPackage : null

  return {
    isFlooring,
    m2PerPackage,
    totalCoverage,
    unitPrice,
    pricePerM2,
  }
}

const CompactCartLineItem = ({ item, cart, fields }: CartLineItemProps) => {
  const { isFlooring, m2PerPackage, totalCoverage, pricePerM2 } = getLineItemFlooringData(item)

  return (
    <div className="flex items-start gap-x-4" data-testid="cart-item">
      <Thumbnail thumbnail={item.thumbnail} alt={item.product_title || item.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-base font-medium line-clamp-1 text-zinc-900">
              {item.product_title}
            </h4>
            <div className="text-sm text-zinc-600">
              {item.variant_title && item.variant_title !== "Default Variant" && (
                <span>{item.variant_title}</span>
              )}
            </div>

            {isFlooring && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-golvfabriken-green/10 text-golvfabriken-green">
                  {item.quantity} paket • {totalCoverage} m²
                </span>
                {pricePerM2 && (
                  <span className="text-[11px] text-zinc-500">
                    ({pricePerM2.toFixed(2)} kr/m²)
                  </span>
                )}
              </div>
            )}
          </div>
          <CartDeleteItem item={item} fields={fields} />
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <CartItemQuantitySelector item={item} fields={fields} />
          <Price price={item.total || 0} currencyCode={cart.currency_code} textSize="small" textWeight="plus" />
        </div>
      </div>
    </div>
  )
}

const DisplayCartLineItem = ({ item, cart, className }: CartLineItemProps) => {
  const { t } = useTranslation()
  const { isFlooring, m2PerPackage, totalCoverage, pricePerM2 } = getLineItemFlooringData(item)
  
  return (
    <div
      className={clsx(
        "flex items-center gap-4 py-3 border-b border-zinc-300 last:border-b-0",
        className
      )}
    >
      <Thumbnail
        thumbnail={item.thumbnail}
        alt={item.product_title || item.title}
        className="w-16 h-16"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-zinc-900">{item.product_title}</p>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <p className="text-sm text-zinc-600">{item.variant_title}</p>
        )}
        
        {isFlooring ? (
          <div className="mt-0.5 space-y-0.5">
            <p className="text-xs font-semibold text-golvfabriken-green">
              {item.quantity} paket ({totalCoverage} m² totalt)
            </p>
            <p className="text-[11px] text-zinc-500">
              {m2PerPackage} m²/paket {pricePerM2 ? `• ${pricePerM2.toFixed(2)} kr/m²` : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">{t('cart.quantity')}: {item.quantity}</p>
        )}
      </div>
      <div className="text-right">
        <Price price={item.total || 0} currencyCode={cart.currency_code} textWeight="plus" />
      </div>
    </div>
  )
}

export const CartLineItem = ({
  item,
  cart,
  type = "default",
  fields,
  className,
}: CartLineItemProps) => {
  const { isFlooring, m2PerPackage, totalCoverage, pricePerM2, unitPrice } = getLineItemFlooringData(item)

  if (type === "compact") {
    return <CompactCartLineItem item={item} cart={cart} fields={fields} className={className} />
  }

  if (type === "display") {
    return <DisplayCartLineItem item={item} cart={cart} className={className} />
  }

  return (
    <div className="flex items-center gap-6 py-4">
      <div className="flex-shrink-0">
        <Thumbnail thumbnail={item.thumbnail} alt={item.product_title || item.title} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-y-1">
        <span className="text-zinc-900 text-base font-semibold">{item.product_title}</span>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <span className="text-zinc-600 text-sm">{item.variant_title}</span>
        )}

        {isFlooring && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-golvfabriken-green/10 text-golvfabriken-green">
              {item.quantity} paket ({totalCoverage} m²)
            </span>
            <span className="text-xs text-zinc-500">
              Paketstorlek: {m2PerPackage} m² {pricePerM2 ? `• ${pricePerM2.toFixed(2)} kr/m²` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <CartItemQuantitySelector item={item} fields={fields} />
          {isFlooring && (
            <span className="text-[11px] text-zinc-500 font-medium mt-0.5">paket</span>
          )}
        </div>

        <div className="text-right">
          <LineItemPrice item={item} currencyCode={cart.currency_code} />
          {isFlooring && pricePerM2 && (
            <span className="block text-xs text-zinc-500 font-medium mt-0.5">
              {pricePerM2.toFixed(2)} kr/m²
            </span>
          )}
        </div>

        <CartDeleteItem item={item} fields={fields} />
      </div>
    </div>
  )
}


interface CartSummaryProps {
  cart: HttpTypes.StoreCart
}

export const CartSummary = ({ cart }: CartSummaryProps) => {
  const { t } = useTranslation()
  
  if ("isOptimistic" in cart && cart.isOptimistic) {
    return <Loading />
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.subtotal')}</span>
          <Price
            price={cart.subtotal}
            currencyCode={cart.currency_code}
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.shipping')}</span>
          <Price
            price={cart.shipping_total}
            currencyCode={cart.currency_code}
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.discount')}</span>
          <Price
            price={cart.discount_total}
            currencyCode={cart.currency_code}
            type="discount"
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.tax')}</span>
          <Price
            price={cart.tax_total}
            currencyCode={cart.currency_code}
            className="text-zinc-600"
          />
        </div>
      </div>

      <hr className="bg-zinc-200" />

      <div className="flex justify-between text-sm">
        <span className="text-zinc-900">{t('cart.total')}</span>
        <Price price={cart.total} currencyCode={cart.currency_code} className="text-zinc-900" />
      </div>
    </div>
  )
}


type CartPromoProps = {
  cart: HttpTypes.StoreCart
}

export const CartPromo = ({ cart }: CartPromoProps) => {
  const { t } = useTranslation()
  const [showInput, setShowInput] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const applyPromoCodeMutation = useApplyPromoCode()
  const removePromoCodeMutation = useRemovePromoCode()

  const handleRemove = (code: string) => {
    removePromoCodeMutation.mutate({ code })
  }

  const handleApply = () => {
    applyPromoCodeMutation.mutate(
      { code: promoCode },
      {
        onSuccess: () => {
          setShowInput(false)
          setPromoCode("")
        },
      }
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cart.promotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cart.promotions.map((promotion) => (
            <Button key={promotion.code} variant="secondary" size="fit">
              {promotion.code}
              <XMark
                onClick={() => handleRemove(promotion.code || "")}
                className="ml-2 text-zinc-600 hover:text-zinc-500 cursor-pointer"
              />
            </Button>
          ))}
        </div>
      )}

      {!showInput && (
        <Button
          onClick={() => setShowInput(true)}
          variant="transparent"
          className="text-zinc-600 p-0 underline hover:bg-transparent hover:text-zinc-500"
          size="fit"
        >
          {t('cart.addPromoCode')}
        </Button>
      )}

      {showInput && (
        <div className="flex gap-2">
          <Input
            placeholder={t('cart.enterPromoCode')}
            name="promoCode"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <Button onClick={handleApply} variant="primary" size="fit">
            {t('cart.apply')}
          </Button>
          <Button onClick={() => setShowInput(false)} variant="secondary" size="fit">
            {t('cart.cancel')}
          </Button>
        </div>
      )}
    </div>
  )
}


export const CartEmpty = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"

  return (
    <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-bold text-zinc-900">{t('cart.emptyTitle')}</h2>
      <p className="text-zinc-600 text-base font-medium">{t('cart.emptyDescription')}</p>
      <Link to="/$countryCode/store" params={{ countryCode }}>
        <Button variant="primary" size="fit">
          {t('cart.continueShopping')}
        </Button>
      </Link>
    </div>
  )
}


export const DEFAULT_CART_DROPDOWN_FIELDS = "id, *items, total, currency_code, item_subtotal"

export const CartDropdown = () => {
  const { t } = useTranslation()
  const { isOpen, openCart, closeCart } = useCartDrawer()
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"

  const sortedItems = sortCartItems(cart?.items || [])
  const itemCount = sortedItems?.reduce((total, item) => total + item.quantity, 0) || 0

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <DrawerTrigger asChild>
        <button className="text-zinc-600 hover:text-zinc-500 h-full">
          {t('cart.cart')} ({itemCount})
        </button>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{t('cart.shoppingCart')}</DrawerTitle>
        </DrawerHeader>

        {/* Empty Cart */}
        {(!cart || itemCount === 0) && (
          <div className="flex flex-col items-center justify-center flex-1 p-6">
            <span className="text-base font-medium text-zinc-600 mb-4">
              {t('cart.emptyTitle')}
            </span>
            <Link to="/$countryCode/store" params={{ countryCode }} onClick={closeCart}>
              <Button variant="secondary" size="fit">
                {t('cart.exploreProducts')}
              </Button>
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {cart && itemCount > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sortedItems?.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  cart={cart}
                  type="compact"
                  fields={DEFAULT_CART_DROPDOWN_FIELDS}
                />
              ))}
            </div>

            <DrawerFooter>
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium text-zinc-600">{t('cart.subtotal')}</span>
                <Price price={cart.item_subtotal} currencyCode={cart.currency_code} />
              </div>

              <Link to="/$countryCode/cart" params={{ countryCode }} onClick={closeCart}>
                <Button className="w-full" variant="primary">
                  {t('cart.goToCart')}
                </Button>
              </Link>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// Default export for backwards compatibility
export default CartLineItem
