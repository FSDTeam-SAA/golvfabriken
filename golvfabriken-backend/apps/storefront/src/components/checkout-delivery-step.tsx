import ShippingItemSelector from "@/components/shipping-item-selector"
import { Button } from "@/components/ui/button"
import {
  useSetCartShippingMethod,
  useShippingOptions,
  useValidateCheckoutShippingAddress,
} from "@/lib/hooks/use-checkout"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "@/lib/hooks/use-translation"

interface DeliveryStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
  onBack: () => void;
}

const DeliveryStep = ({ cart, onNext, onBack }: DeliveryStepProps) => {
  const { t } = useTranslation()
  const { data: shippingOptions } = useShippingOptions({ cart_id: cart.id })
  const setShippingMethodMutation = useSetCartShippingMethod()
  const validateShippingAddressMutation = useValidateCheckoutShippingAddress()
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    cart.shipping_methods?.[0]?.shipping_option_id || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addressValidationMessage, setAddressValidationMessage] = useState<string | null>(null)
  const hasAutoSelected = useRef(false)

  useEffect(() => {
    // Auto-select first option if none selected and options are available
    if (!hasAutoSelected.current && !selectedOptionId && shippingOptions && shippingOptions.length > 0) {
      hasAutoSelected.current = true
      setSelectedOptionId(shippingOptions[0].id)
    }
  }, [shippingOptions, selectedOptionId])

  const handleSubmit = async () => {
    if (!selectedOptionId || isSubmitting) return

    setIsSubmitting(true)
    setAddressValidationMessage(null)

    try {
      const shippingAddress = cart.shipping_address

      if (shippingAddress) {
        const validation = await validateShippingAddressMutation.mutateAsync({
          country_code: shippingAddress.country_code,
          postal_code: shippingAddress.postal_code,
          city: shippingAddress.city,
          address_line1: shippingAddress.address_1,
          company: shippingAddress.company || undefined,
          recipient_name: [shippingAddress.first_name, shippingAddress.last_name]
            .filter(Boolean)
            .join(" ")
            .trim(),
          phone: shippingAddress.phone || undefined,
        })

        const isValid = Boolean(validation?.validation?.is_valid)
        if (!isValid) {
          setAddressValidationMessage(
            validation?.reason ||
              validation?.note ||
              "Shipping address validation failed. Please review your delivery address."
          )
          return
        }

        if (Array.isArray(validation?.validation?.warnings) &&
          validation.validation.warnings.length > 0) {
          setAddressValidationMessage(validation.validation.warnings.join(" | "))
        }
      }

      await setShippingMethodMutation.mutateAsync(
        {
          shipping_option_id: selectedOptionId,
        },
        {
          onSuccess: () => {
            onNext()
          },
        }
      )
    } catch (error) {
      setAddressValidationMessage(
        error instanceof Error
          ? error.message
          : "Unable to validate shipping address right now."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {shippingOptions?.map((option) => (
          <ShippingItemSelector
            key={option.id}
            shippingOption={option}
            isSelected={selectedOptionId === option.id}
            handleSelect={setSelectedOptionId}
            cart={cart}
          />
        ))}
      </div>
      {addressValidationMessage && (
        <div className="text-sm text-zinc-700 border border-zinc-300 rounded p-3">
          {addressValidationMessage}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          {t('common.back')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedOptionId || isSubmitting}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}

export default DeliveryStep
