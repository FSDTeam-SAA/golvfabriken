import {
  CartLineItem,
  CartSummary,
  CartEmpty,
  CartPromo,
} from "@/components/cart"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { useCart, useCreateCart } from "@/lib/hooks/use-cart"
import { CheckoutStepKey } from "@/lib/types/global"
import { sortCartItems } from "@/lib/utils/cart"
import { Link, useLoaderData } from "@tanstack/react-router"
import { useTranslation } from "@/lib/hooks/use-translation"

const DEFAULT_CART_FIELDS =
  "id, *items, total, currency_code, subtotal, shipping_total, discount_total, tax_total, *promotions"

const Cart = () => {
  const { t } = useTranslation()
  const { region, countryCode } = useLoaderData({
    from: "/$countryCode/cart",
  })
  const { data: cart, isLoading: cartLoading } = useCart({
    fields: DEFAULT_CART_FIELDS,
  })
  const createCartMutation = useCreateCart()

  // Auto-create cart if none exists
  if (!cart && !cartLoading && !createCartMutation.isPending) {
    createCartMutation.mutate({ region_id: region.id })
  }

  const cartItems = sortCartItems(cart?.items || [])
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="content-container py-6 sm:py-10 px-4 sm:px-6">
      {cartLoading ? (
        <div className="py-20 flex justify-center">
          <Loading />
        </div>
      ) : cartItems.length === 0 ? (
        <CartEmpty />
      ) : (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-zinc-200">
            <div className="flex items-baseline gap-3">
              <h1 className="text-zinc-900 text-2xl sm:text-3xl font-bold tracking-tight">
                {t('cart.title')}
              </h1>
              <span className="text-zinc-500 text-sm sm:text-base font-normal">
                ({totalItemCount} {totalItemCount === 1 ? 'produkt' : 'produkter'})
              </span>
            </div>
            {cartItems.length > 0 && (
              <Link
                to="/$countryCode/store"
                params={{ countryCode }}
                className="text-golvfabriken-green hover:text-golvfabriken-green-dark text-sm font-medium underline underline-offset-4 transition-colors w-fit"
              >
                {t('cart.continueShopping')}
              </Link>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Cart Items List */}
            <div className="w-full lg:w-2/3 divide-y divide-zinc-200">
              {cartItems.map((item) => (
                <div key={item.id} className="first:pt-0">
                  <CartLineItem
                    item={item}
                    cart={cart!}
                    fields={DEFAULT_CART_FIELDS}
                  />
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            {cart && (
              <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200/90 p-5 sm:p-6 space-y-6">
                  <h2 className="text-zinc-900 text-lg font-bold border-b border-zinc-200 pb-3">
                    {t('checkout.summary.orderSummary')}
                  </h2>

                  <CartSummary cart={cart} />

                  <div className="pt-2">
                    <CartPromo cart={cart} />
                  </div>

                  <Link
                    to="/$countryCode/checkout"
                    params={{ countryCode }}
                    search={{ step: CheckoutStepKey.ADDRESSES }}
                    className="block w-full pt-2"
                  >
                    <Button className="w-full py-3.5 text-base font-semibold bg-golvfabriken-green hover:bg-golvfabriken-green-dark text-white rounded-xl shadow-sm transition-all">
                      {t('cart.proceedToCheckout')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
