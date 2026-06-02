import { Button } from "@/components/ui/button"
import { useCompleteCartOrder } from "@/lib/hooks/use-checkout"
import { isManual, isStripe } from "@/lib/utils/checkout"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "@/lib/hooks/use-translation"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart;
  className?: string;
  requireTermsAccepted?: boolean;
  termsAccepted?: boolean;
  forceDisabled?: boolean;
  disabledMessage?: string;
};

const PaymentButton = ({
  cart,
  className,
  requireTermsAccepted = false,
  termsAccepted = true,
  forceDisabled = false,
  disabledMessage,
}: PaymentButtonProps) => {
  const { t } = useTranslation()
  const termsGateMissing = requireTermsAccepted && !termsAccepted
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1 ||
    termsGateMissing ||
    forceDisabled

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          className={className}
          termsGateMissing={termsGateMissing}
          forceDisabled={forceDisabled}
          disabledMessage={disabledMessage}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualPaymentButton
          notReady={notReady}
          className={className}
          termsGateMissing={termsGateMissing}
          forceDisabled={forceDisabled}
          disabledMessage={disabledMessage}
        />
      )
    default:
      return <Button disabled>{t('checkout.selectPaymentMethod')}</Button>
  }
}

const StripePaymentButton = ({
  notReady,
  className,
  termsGateMissing = false,
  forceDisabled = false,
  disabledMessage,
}: {
  notReady: boolean;
  className?: string;
  termsGateMissing?: boolean;
  forceDisabled?: boolean;
  disabledMessage?: string;
}) => {
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const completeOrderMutation = useCompleteCartOrder()

  const handlePayment = async () => {
    setErrorMessage(null)

    try {
      // For demo purposes, we'll complete the order directly
      // In production, you'd integrate with Stripe's confirmCardPayment
      const order = await completeOrderMutation.mutateAsync()

      // Navigate to order confirmation
      navigate({
        to: `/${countryCode}/order/${order.id}/confirmed`,
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('checkout.paymentFailed')
      )
    }
  }

  return (
    <>
      <Button
        disabled={notReady || completeOrderMutation.isPending}
        onClick={handlePayment}
        data-testid="place-order-button"
        className={className}
      >
        {t('checkout.placeOrder')}
      </Button>
      {termsGateMissing && (
        <div className="text-zinc-600 text-sm mt-2">
          Please accept the purchase terms before placing your order.
        </div>
      )}
      {forceDisabled && disabledMessage && (
        <div className="text-zinc-600 text-sm mt-2">
          {disabledMessage}
        </div>
      )}
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
    </>
  )
}

const ManualPaymentButton = ({
  notReady,
  className,
  termsGateMissing = false,
  forceDisabled = false,
  disabledMessage,
}: {
  notReady: boolean;
  className?: string;
  termsGateMissing?: boolean;
  forceDisabled?: boolean;
  disabledMessage?: string;
}) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const completeOrderMutation = useCompleteCartOrder()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const order = await completeOrderMutation.mutateAsync()

      // Navigate to order confirmation
      navigate({
        to: `/${countryCode}/order/${order.id}/confirmed`,
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('checkout.failedToPlaceOrder')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        onClick={handlePayment}
        data-testid="place-order-button"
        className={className}
      >
        {t('checkout.placeOrder')}
      </Button>
      {termsGateMissing && (
        <div className="text-zinc-600 text-sm mt-2">
          Please accept the purchase terms before placing your order.
        </div>
      )}
      {forceDisabled && disabledMessage && (
        <div className="text-zinc-600 text-sm mt-2">
          {disabledMessage}
        </div>
      )}
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
    </>
  )
}

export default PaymentButton
