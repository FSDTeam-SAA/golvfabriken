import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "@medusajs/icons"
import { useTranslation } from "@/lib/hooks/use-translation"

type OrderConfirmedSearch = {
  cart_id?: string
}

export const Route = createFileRoute("/$countryCode/order-confirmed")({
  component: OrderConfirmedPage,
  validateSearch: (search: Record<string, unknown>): OrderConfirmedSearch => {
    return {
      cart_id: search.cart_id as string | undefined,
    }
  },
})

function OrderConfirmedPage() {
  const { t } = useTranslation()
  const { cart_id } = useSearch({ from: "/$countryCode/order-confirmed" })
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pollingAttempts, setPollingAttempts] = useState(0)

  useEffect(() => {
    if (!cart_id) {
      setError("No cart ID provided")
      setIsLoading(false)
      return
    }

    const pollOrderStatus = async () => {
      try {
        // Try to retrieve the order by cart ID
        const { orders } = await sdk.store.order.list({
          fields: "+cart_id",
        })

        const order = orders.find((o: any) => o.cart_id === cart_id)

        if (order) {
          setOrderId(order.id)
          setIsLoading(false)
          return
        }

        // If no order found after 5 attempts (10 seconds), show error
        if (pollingAttempts >= 5) {
          setError(t('order.orderConfirmationDelay'))
          setIsLoading(false)
          return
        }

        // Continue polling
        setPollingAttempts((prev) => prev + 1)
        setTimeout(pollOrderStatus, 2000)
      } catch (err: any) {
        if (pollingAttempts >= 5) {
          setError(
            err.message || t('order.orderConfirmationDelay')
          )
          setIsLoading(false)
        } else {
          setPollingAttempts((prev) => prev + 1)
          setTimeout(pollOrderStatus, 2000)
        }
      }
    }

    pollOrderStatus()
  }, [cart_id, pollingAttempts, t])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          {t('order.orderConfirming')}
        </h2>
        <p className="text-zinc-600 text-center max-w-md">
          {t('order.orderConfirmingDescription')}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-rose-900 mb-2">
            {t('order.orderConfirmationPending')}
          </h2>
          <p className="text-rose-700 mb-4">{error}</p>
          <Button onClick={() => navigate({ to: "/" })}>
            {t('order.returnToHome')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white border border-zinc-200 rounded-lg p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
          {t('order.thankYou')}
        </h1>
        <p className="text-zinc-600 mb-6">
          {t('order.orderConfirmedDescription')}
        </p>
        {orderId && (
          <div className="bg-zinc-50 border border-zinc-200 rounded p-4 mb-6">
            <p className="text-sm text-zinc-600 mb-1">{t('order.orderNumber')}:</p>
            <p className="text-lg font-semibold text-zinc-900">{orderId}</p>
          </div>
        )}
        <p className="text-sm text-zinc-600 mb-6">
          {t('order.orderEmailConfirmation')}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="secondary"
            onClick={() => navigate({ to: "/" })}
          >
            {t('order.continueShopping')}
          </Button>
        </div>
      </div>
    </div>
  )
}
