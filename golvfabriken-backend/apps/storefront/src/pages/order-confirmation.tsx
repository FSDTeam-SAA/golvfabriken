import { OrderDetails } from "@/components/order"
import { useLoaderData } from "@tanstack/react-router"
import { useTranslation } from "@/lib/hooks/use-translation"

/**
 * Order Confirmation Page Pattern
 *
 * Demonstrates:
 * - useLoaderData for SSR-loaded order
 * - Displaying order after successful checkout
 * - OrderDetails component for order information
 */
const OrderConfirmation = () => {
  const { t } = useTranslation()
  const { order } = useLoaderData({
    from: "/$countryCode/order/$orderId/confirmed",
  })

  if (!order) {
    return (
      <div className="content-container py-6">
        <h1 className="text-xl mb-6">{t('order.orderNotFound')}</h1>
        <p className="text-secondary-text mb-6">{t('order.orderNotFoundDescription')}</p>
      </div>
    )
  }

  return (
    <div className="content-container py-6">
      <h1 className="text-xl mb-6">{t('order.orderConfirmed')}</h1>
      <p className="text-secondary-text mb-6">{t('order.thankYou')}</p>
      <OrderDetails order={order} />
    </div>
  )
}

export default OrderConfirmation
