import Address from "@/components/address"
import PaymentMethodInfo from "@/components/payment-method-info"
import { Price } from "@/components/ui/price"
import { Thumbnail } from "@/components/ui/thumbnail"
import { isPaidWithGiftCard } from "@/lib/utils/checkout"
import { formatOrderId } from "@/lib/utils/order"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/hooks/use-translation"

type OrderInfoProps = {
  order: HttpTypes.StoreOrder
}

export const OrderInfo = ({ order }: OrderInfoProps) => {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold">{t('order.orderDetails')}</h3>
      <div className="flex gap-2 items-center">
        <span className="text-base font-semibold text-zinc-900">{t('order.orderInfo.orderId')}</span>
        <span className="text-sm text-zinc-600">
          {formatOrderId(String(order.display_id ?? order.id ?? ""))}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-base font-semibold text-zinc-900">{t('order.orderInfo.orderDate')}</span>
        <span className="text-sm text-zinc-600">
          {new Date(order.created_at!).toLocaleDateString("sv-SE", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-base font-semibold text-zinc-900">{t('order.orderInfo.orderStatus')}</span>
        <span className="text-sm text-zinc-600">{order.status}</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-base font-semibold text-zinc-900">{t('order.orderInfo.orderEmail')}</span>
        <span className="text-sm text-zinc-600">
          {order.customer?.email ?? order.email ?? "N/A"}
        </span>
      </div>
    </div>
  )
}

type OrderLineItemProps = {
  item: HttpTypes.StoreOrderLineItem
  order: HttpTypes.StoreOrder
}

export const OrderLineItem = ({ item, order }: OrderLineItemProps) => {
  const { t } = useTranslation()
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

  return (
    <div className="flex items-center gap-4 py-3 border-b border-zinc-200 last:border-b-0">
      <Thumbnail
        thumbnail={item.thumbnail}
        alt={item.product_title || item.title}
        className="w-16 h-16"
      />
      <div className="flex-1 flex flex-col gap-y-1">
        <span className="text-base font-semibold text-zinc-900">{item.product_title}</span>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <span className="text-sm text-zinc-600">{item.variant_title}</span>
        )}
        {isFlooring ? (
          <div className="mt-0.5 space-y-0.5">
            <span className="text-xs font-semibold text-golvfabriken-green block">
              {item.quantity} paket ({totalCoverage} m² totalt)
            </span>
            <span className="text-[11px] text-zinc-500 block">
              {m2PerPackage} m²/paket {pricePerM2 ? `• ${pricePerM2.toFixed(2)} kr/m²` : ""}
            </span>
          </div>
        ) : (
          <span className="text-sm text-zinc-600">{t('cart.quantity')}: {item.quantity}</span>
        )}
      </div>
      <div className="text-right">
        <Price
          price={item.total}
          currencyCode={order.currency_code}
          className="text-zinc-900 font-semibold"
        />
        {isFlooring && pricePerM2 && (
          <span className="block text-xs text-zinc-500">
            {pricePerM2.toFixed(2)} kr/m²
          </span>
        )}
      </div>
    </div>
  )
}

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

export const OrderSummary = ({ order }: OrderSummaryProps) => {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-4">
      <h3 className="mb-4 font-semibold">{t('order.summary')}</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.subtotal')}</span>
          <Price
            price={order.subtotal}
            currencyCode={order.currency_code}
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.shipping')}</span>
          <Price
            price={order.shipping_total}
            currencyCode={order.currency_code}
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.discount')}</span>
          <Price
            price={order.discount_total}
            currencyCode={order.currency_code}
            type="discount"
            className="text-zinc-600"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">{t('cart.tax')}</span>
          <Price
            price={order.tax_total}
            currencyCode={order.currency_code}
            className="text-zinc-600"
          />
        </div>
      </div>

      <hr className="bg-zinc-200" />

      <div className="flex justify-between">
        <span className="text-zinc-900 text-sm">{t('cart.total')}</span>
        <Price price={order.total} currencyCode={order.currency_code} />
      </div>
    </div>
  )
}

type OrderShippingProps = {
  order: HttpTypes.StoreOrder
}

export const OrderShipping = ({ order }: OrderShippingProps) => {
  const { t } = useTranslation()
  
  return (
    <div>
      <h3 className="mb-4 font-semibold">{t('order.deliveryInformation')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-base font-semibold text-zinc-900 mb-2">
            {t('checkout.shippingAddress')}
          </span>
          {order.shipping_address && <Address address={order.shipping_address} />}
        </div>

        {order.shipping_methods?.[0] && (
          <div>
            <span className="text-base font-semibold text-zinc-900 mb-2">
              {t('checkout.shippingMethod')}
            </span>
            <div className="text-sm text-zinc-600 flex items-center justify-between">
              <div>{order.shipping_methods[0].name}</div>
              <Price
                price={order.shipping_methods[0].amount}
                currencyCode={order.currency_code}
                className="text-zinc-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type OrderBillingProps = {
  order: HttpTypes.StoreOrder
}

export const OrderBilling = ({ order }: OrderBillingProps) => {
  const { t } = useTranslation()
  const paidByGiftcard = isPaidWithGiftCard(order)

  return (
    <div>
      <h3 className="mb-4">{t('order.billingInformation')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-base font-semibold text-zinc-900 mb-2">
            {t('checkout.billingAddress')}
          </span>
          <div className="text-sm text-zinc-600">
            {order.billing_address ? (
              <Address address={order.billing_address} />
            ) : (
              <span>{t('checkout.sameAsShipping')}</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-base font-semibold text-zinc-900 mb-2">{t('checkout.paymentMethod')}</span>
          <div className="text-sm text-zinc-600">
            {order.payment_collections?.[0].payment_sessions?.[0] && (
              <PaymentMethodInfo
                provider_id={order.payment_collections[0].payment_sessions[0].provider_id}
              />
            )}
            {paidByGiftcard && <span>{t('checkout.giftCard')}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

interface OrderDetailsProps {
  order: HttpTypes.StoreOrder
}

export const OrderDetails = ({ order }: OrderDetailsProps) => {
  const { t } = useTranslation()
  
  return (
    <div>
      <div className="flex flex-col gap-8">
        <OrderInfo order={order} />
        <hr className="bg-zinc-200" />
        <div className="flex flex-col gap-4">
          <h3 className="mb-4 font-semibold">{t('order.items')}</h3>
          {order.items?.map((item) => (
            <OrderLineItem key={item.id} item={item} order={order} />
          ))}
        </div>
        <hr className="bg-zinc-200" />
        <OrderShipping order={order} />
        <hr className="bg-zinc-200" />
        <OrderBilling order={order} />
        <hr className="bg-zinc-200" />
        <OrderSummary order={order} />
      </div>
    </div>
  )
}

export default OrderDetails
