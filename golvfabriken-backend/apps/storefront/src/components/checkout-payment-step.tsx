import PaymentContainer from "@/components/payment-container"
import StripeCardContainer from "@/components/stripe-card-container"
import KustomCheckoutContainer from "@/components/kustom-checkout-container"
import { Button } from "@/components/ui/button"
import {
  useB2BCheckoutContext,
  useCartPaymentMethods,
  useInitiateCartPaymentSession,
} from "@/lib/hooks/use-checkout"
import { 
  isStripe as isStripeFunc, 
  isKustom as isKustomFunc, 
  getActivePaymentSession, 
  isPaidWithGiftCard 
} from "@/lib/utils/checkout"
import { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "@/lib/hooks/use-translation"

interface PaymentStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
  onBack: () => void;
}

const PaymentStep = ({ cart, onNext, onBack }: PaymentStepProps) => {
  const { t } = useTranslation()
  const { data: availablePaymentMethods = [] } = useCartPaymentMethods({
    region_id: cart.region?.id,
  })
  const cartMetadata = (cart.metadata || {}) as Record<string, unknown>
  const b2bCompanyId = String(cartMetadata.b2b_company_id || "").trim()
  const { data: b2bCheckoutContext } = useB2BCheckoutContext({
    company_id: b2bCompanyId || undefined,
  })
  const initiatePaymentSessionMutation = useInitiateCartPaymentSession()

  const activeSession = getActivePaymentSession(cart)

  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const parseAllowedPaymentIds = (
    value: unknown
  ): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  }

  const filteredPaymentMethods = (() => {
    const configuredAllowedIds = parseAllowedPaymentIds(
      b2bCheckoutContext?.allowed_payment_method_ids ??
        cartMetadata.b2b_allowed_payment_methods
    )

    if (configuredAllowedIds.length) {
      const allowedIdSet = new Set(configuredAllowedIds)
      const configured = availablePaymentMethods.filter((method) =>
        allowedIdSet.has(method.id)
      )
      if (configured.length > 0) {
        return configured
      }
    }

    return availablePaymentMethods
  })()

  const isStripe = isStripeFunc(selectedPaymentMethod)
  const isKustom = isKustomFunc(selectedPaymentMethod)

  const paidByGiftcard = isPaidWithGiftCard(cart)

  const initiatePaymentSession = useCallback(
    async (method: string) => {
      initiatePaymentSessionMutation.mutateAsync(
        { provider_id: method },
        {
          onError: (error) => {
            setError(
              error instanceof Error ? error.message : t('checkout.errorOccurred')
            )
          },
        }
      )
    },
    [initiatePaymentSessionMutation, t]
  )

  const handlePaymentMethodChange = useCallback(
    async (method: string) => {
      setError(null)
      setSelectedPaymentMethod(method)

      initiatePaymentSession(method)
    },
    [initiatePaymentSession]
  )

  // Update selected payment method when payment methods are loaded
  useEffect(() => {
    if (!selectedPaymentMethod && filteredPaymentMethods?.length > 0) {
      const firstMethod = filteredPaymentMethods[0]
      if (firstMethod) {
        setSelectedPaymentMethod(firstMethod.id)
        handlePaymentMethodChange(firstMethod.id)
      }
    }
  }, [filteredPaymentMethods, selectedPaymentMethod, handlePaymentMethodChange])

  const handleSubmit = useCallback(async () => {
    if (!selectedPaymentMethod) return

    if (!activeSession) {
      await initiatePaymentSession(selectedPaymentMethod)
    }

    // For Kustom, don't proceed to next step yet - customer completes payment in iframe
    if (!isKustomFunc(selectedPaymentMethod)) {
      onNext()
    }
  }, [selectedPaymentMethod, activeSession, onNext, initiatePaymentSession])

  return (
    <div className="flex flex-col gap-8">
      {!paidByGiftcard && (
        <>
          {(filteredPaymentMethods?.length ?? 0) === 0 && (
            <p className="text-base font-medium text-zinc-600">
              {t('checkout.noPaymentMethods')}
            </p>
          )}
          {filteredPaymentMethods.map((paymentMethod) => (
            <div key={paymentMethod.id}>
              <PaymentContainer
                paymentProviderId={paymentMethod.id}
                selectedPaymentOptionId={selectedPaymentMethod}
                onClick={() => handlePaymentMethodChange(paymentMethod.id)}
              >
                {isStripeFunc(paymentMethod.id) && (
                  <StripeCardContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    setError={setError}
                    onSelect={() => handlePaymentMethodChange(paymentMethod.id)}
                    onCardComplete={handleSubmit}
                  />
                )}
                {isKustomFunc(paymentMethod.id) && activeSession && (
                  <KustomCheckoutContainer
                    paymentSession={activeSession}
                    cart={cart}
                    onComplete={onNext}
                  />
                )}
              </PaymentContainer>
            </div>
          ))}
        </>
      )}

      {paidByGiftcard && (
        <div className="flex flex-col w-1/3">
          <p className="text-base font-semibold text-zinc-900 mb-1">
            {t('checkout.paymentMethod')}
          </p>
          <p
            className="text-base font-semibold text-zinc-600"
            data-testid="payment-method-summary"
          >
            {t('checkout.giftCard')}
          </p>
        </div>
      )}

      {error && (
        <div
          className="text-rose-900 text-sm"
          data-testid="payment-method-error-message"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={initiatePaymentSessionMutation.isPending}
        >
          {t('common.back')}
        </Button>
        {!isKustom && (
          <Button
            onClick={handleSubmit}
            disabled={
              (isStripe && !activeSession) ||
              (!selectedPaymentMethod && !paidByGiftcard) ||
              initiatePaymentSessionMutation.isPending
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeFunc(selectedPaymentMethod)
              ? t('checkout.enterCardDetails')
              : t('common.next')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default PaymentStep
