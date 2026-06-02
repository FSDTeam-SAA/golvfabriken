import Address from "@/components/address"
import PaymentButton from "@/components/payment-button"
import PaymentMethodInfo from "@/components/payment-method-info"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { useUpdateCart } from "@/lib/hooks/use-cart"
import {
  useB2BCheckoutContext,
  useSubmitB2BApprovalRequest,
} from "@/lib/hooks/use-checkout"
import { getActivePaymentSession, isPaidWithGiftCard } from "@/lib/utils/checkout"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/hooks/use-translation"
import { useCallback, useEffect, useRef, useState } from "react"

interface ReviewStepProps {
  cart: HttpTypes.StoreCart;
  onBack: () => void;
}

const ReviewStep = ({ cart, onBack }: ReviewStepProps) => {
  const { t } = useTranslation()
  const paidByGiftcard = isPaidWithGiftCard(cart)
  const activeSession = getActivePaymentSession(cart)
  const updateCartMutation = useUpdateCart()
  const submitB2BApprovalMutation = useSubmitB2BApprovalRequest()
  const cartMetadata = (cart.metadata || {}) as Record<string, unknown>
  const b2bCompanyId = String(cartMetadata.b2b_company_id || "").trim()
  const { data: b2bCheckoutContext } = useB2BCheckoutContext({
    company_id: b2bCompanyId || undefined,
  })
  const b2bContextSyncRef = useRef<string>("")
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean>(false)
  const [poNumber, setPoNumber] = useState<string>("")
  const [invoiceReference, setInvoiceReference] = useState<string>("")
  const [depotReference, setDepotReference] = useState<string>("")
  const [approvalStatus, setApprovalStatus] = useState<string>(
    String(cartMetadata.b2b_approval_status || "")
  )
  const [approvalId, setApprovalId] = useState<string>(
    String(cartMetadata.b2b_approval_id || "")
  )
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null)

  const asBoolean = (value: unknown) => {
    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      return normalized === "true" || normalized === "1" || normalized === "yes"
    }

    if (typeof value === "number") {
      return value === 1
    }

    return false
  }

  useEffect(() => {
    setTermsAccepted(asBoolean(cartMetadata.checkout_terms_accepted))
    setNewsletterOptIn(asBoolean(cartMetadata.checkout_newsletter_opt_in))
    setPoNumber(String(cartMetadata.b2b_po_number || ""))
    setInvoiceReference(String(cartMetadata.b2b_invoice_reference || ""))
    setDepotReference(String(cartMetadata.b2b_depot_reference || ""))
    setApprovalStatus(String(cartMetadata.b2b_approval_status || ""))
    setApprovalId(String(cartMetadata.b2b_approval_id || ""))
  }, [
    cart.id,
    cartMetadata.checkout_newsletter_opt_in,
    cartMetadata.checkout_terms_accepted,
    cartMetadata.b2b_po_number,
    cartMetadata.b2b_invoice_reference,
    cartMetadata.b2b_depot_reference,
    cartMetadata.b2b_approval_status,
    cartMetadata.b2b_approval_id,
  ])

  useEffect(() => {
    if (!b2bCompanyId || !b2bCheckoutContext) {
      return
    }

    const syncPayload = {
      company_id: b2bCompanyId,
      approval_threshold: Number(b2bCheckoutContext.approval_threshold || 0),
      approval_required: Boolean(b2bCheckoutContext.approval_required),
      allowed_payment_method_ids: Array.isArray(
        b2bCheckoutContext.allowed_payment_method_ids
      )
        ? b2bCheckoutContext.allowed_payment_method_ids
        : [],
      depots: Array.isArray(b2bCheckoutContext.depots)
        ? b2bCheckoutContext.depots
        : [],
    }
    const signature = JSON.stringify(syncPayload)

    if (b2bContextSyncRef.current === signature) {
      return
    }

    b2bContextSyncRef.current = signature
    updateCartMutation.mutate({
      metadata: {
        ...cartMetadata,
        b2b_company_id: b2bCompanyId,
        b2b_approval_threshold: syncPayload.approval_threshold,
        b2b_approval_required: syncPayload.approval_required,
        b2b_allowed_payment_methods: syncPayload.allowed_payment_method_ids,
        b2b_depots: syncPayload.depots,
        b2b_context_synced_at: new Date().toISOString(),
      },
    })
  }, [b2bCheckoutContext, b2bCompanyId, cartMetadata, updateCartMutation])

  const persistCheckoutPreferences = useCallback(
    (nextTermsAccepted: boolean, nextNewsletterOptIn: boolean) => {
      updateCartMutation.mutate({
        metadata: {
          ...cartMetadata,
          checkout_terms_accepted: nextTermsAccepted,
          checkout_terms_accepted_at: nextTermsAccepted
            ? String(cartMetadata.checkout_terms_accepted_at || new Date().toISOString())
            : null,
          checkout_newsletter_opt_in: nextNewsletterOptIn,
          checkout_newsletter_opt_in_at: nextNewsletterOptIn
            ? String(cartMetadata.checkout_newsletter_opt_in_at || new Date().toISOString())
            : null,
        },
      })
    },
    [cartMetadata, updateCartMutation]
  )

  const onTermsChange = useCallback(
    (checked: boolean) => {
      setTermsAccepted(checked)
      persistCheckoutPreferences(checked, newsletterOptIn)
    },
    [newsletterOptIn, persistCheckoutPreferences]
  )

  const onNewsletterChange = useCallback(
    (checked: boolean) => {
      setNewsletterOptIn(checked)
      persistCheckoutPreferences(termsAccepted, checked)
    },
    [persistCheckoutPreferences, termsAccepted]
  )

  const persistB2BCheckoutFields = useCallback(
    (
      nextPoNumber: string,
      nextInvoiceReference: string,
      nextDepotReference: string
    ) => {
      updateCartMutation.mutate({
        metadata: {
          ...cartMetadata,
          b2b_po_number: nextPoNumber.trim() || null,
          b2b_invoice_reference: nextInvoiceReference.trim() || null,
          b2b_depot_reference: nextDepotReference.trim() || null,
          b2b_checkout_details_updated_at: new Date().toISOString(),
        },
      })
    },
    [cartMetadata, updateCartMutation]
  )

  const asNumber = (value: unknown) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  const companyId = String(cartMetadata.b2b_company_id || "").trim()
  const approvalThreshold = b2bCheckoutContext
    ? asNumber(b2bCheckoutContext.approval_threshold)
    : asNumber(cartMetadata.b2b_approval_threshold)
  const orderTotalMajor = asNumber(cart.total) / 100
  const explicitApprovalRequired = b2bCheckoutContext
    ? Boolean(b2bCheckoutContext.approval_required)
    : asBoolean(cartMetadata.b2b_approval_required)
  const isB2BCheckoutContext = Boolean(
    companyId ||
      poNumber.trim() ||
      invoiceReference.trim() ||
      depotReference.trim()
  )
  const needsApprovalByThreshold =
    approvalThreshold > 0 && orderTotalMajor > approvalThreshold
  const requiresB2BApproval = isB2BCheckoutContext && (explicitApprovalRequired || needsApprovalByThreshold)
  const isApprovalSatisfied =
    !requiresB2BApproval ||
    approvalStatus === "approved" ||
    approvalStatus === "auto_approved"

  const depotOptions = Array.isArray(b2bCheckoutContext?.depots)
    ? b2bCheckoutContext.depots
    : []

  const submitB2BApproval = useCallback(async () => {
    if (!companyId) {
      setApprovalMessage("Missing B2B company context. Set b2b_company_id in cart metadata before submitting approval.")
      return
    }

    setApprovalMessage(null)

    try {
      const response = await submitB2BApprovalMutation.mutateAsync({
        company_id: companyId,
        order_id: cart.id,
        amount_total: orderTotalMajor,
        currency_code: String(cart.currency_code || "SEK").toUpperCase(),
        metadata: {
          po_number: poNumber.trim() || null,
          invoice_reference: invoiceReference.trim() || null,
          depot_reference: depotReference.trim() || null,
        },
      })

      const nextApprovalStatus = String(response.approval_status || "submitted")
      setApprovalId(String(response.approval_id || ""))
      setApprovalStatus(nextApprovalStatus)
      setApprovalMessage(
        nextApprovalStatus === "approved"
          ? "Approval completed. You can place the order now."
          : "Approval request submitted. Continue after approval is confirmed."
      )

      updateCartMutation.mutate({
        metadata: {
          ...cartMetadata,
          b2b_approval_id: response.approval_id || null,
          b2b_approval_status: nextApprovalStatus,
          b2b_approval_submitted_at: new Date().toISOString(),
        },
      })
    } catch (error) {
      setApprovalMessage(error instanceof Error ? error.message : "Failed to submit approval request.")
    }
  }, [
    cart.currency_code,
    cart.id,
    cartMetadata,
    companyId,
    depotReference,
    invoiceReference,
    orderTotalMajor,
    poNumber,
    submitB2BApprovalMutation,
    updateCartMutation,
  ])

  return (
    <div className="flex flex-col gap-8">
      {/* Delivery Information */}
      {cart.shipping_address && (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="text-zinc-900 !text-base font-semibold">
              {t('checkout.shippingAddress')}
            </h3>
            <Address address={cart.shipping_address} />
          </div>

          {cart.shipping_methods?.[0] && (
            <div className="flex flex-col gap-2">
              <h3 className="text-zinc-900 !text-base font-semibold">
                {t('checkout.shippingMethod')}
              </h3>
              <div className="text-sm text-zinc-600 flex items-center gap-2">
                <div>{cart.shipping_methods[0].name}</div>
                <Price
                  price={cart.shipping_methods[0].amount}
                  currencyCode={cart.currency_code}
                  textWeight="plus"
                  className="text-zinc-600"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Information */}
      <div className="flex flex-col gap-2">
        <h3 className="text-zinc-900 !text-base font-semibold">
          {t('checkout.billingAddress')}
        </h3>
        <div className="text-sm text-zinc-600">
          {cart.billing_address ? (
            <Address address={cart.billing_address} />
          ) : (
            <span>{t('checkout.sameAsShipping')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-zinc-900 !text-base font-semibold">
          {t('checkout.paymentMethod')}
        </h3>
        <div className="text-sm text-zinc-600 flex items-center gap-2">
          {activeSession && (
            <PaymentMethodInfo provider_id={activeSession.provider_id} />
          )}
          {paidByGiftcard && <span>{t('checkout.giftCard')}</span>}
        </div>
      </div>

      <p className="text-sm text-zinc-600">
        {t('checkout.orderConfirmation')}
      </p>

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <Checkbox
            checked={termsAccepted}
            onChange={(event) => onTermsChange(event.target.checked)}
            disabled={updateCartMutation.isPending}
          />
          <span>
            I agree to the purchase terms and conditions.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <Checkbox
            checked={newsletterOptIn}
            onChange={(event) => onNewsletterChange(event.target.checked)}
            disabled={updateCartMutation.isPending}
          />
          <span>
            Send me updates and offers by email.
          </span>
        </label>
      </div>

      <div className="border border-zinc-200 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-zinc-900">
          B2B Order References
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span>PO Number</span>
            <input
              type="text"
              value={poNumber}
              onChange={(event) => setPoNumber(event.target.value)}
              onBlur={() =>
                persistB2BCheckoutFields(poNumber, invoiceReference, depotReference)
              }
              className="border border-zinc-300 rounded px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span>Invoice Reference</span>
            <input
              type="text"
              value={invoiceReference}
              onChange={(event) => setInvoiceReference(event.target.value)}
              onBlur={() =>
                persistB2BCheckoutFields(poNumber, invoiceReference, depotReference)
              }
              className="border border-zinc-300 rounded px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            <span>Depot Reference</span>
            {depotOptions.length > 0 ? (
              <select
                value={depotReference}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setDepotReference(nextValue)
                  persistB2BCheckoutFields(poNumber, invoiceReference, nextValue)
                }}
                className="border border-zinc-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Select depot</option>
                {depotOptions.map((depot) => (
                  <option key={depot.id} value={depot.reference || depot.id}>
                    {depot.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={depotReference}
                onChange={(event) => setDepotReference(event.target.value)}
                onBlur={() =>
                  persistB2BCheckoutFields(poNumber, invoiceReference, depotReference)
                }
                className="border border-zinc-300 rounded px-3 py-2 text-sm"
                placeholder="Optional"
              />
            )}
          </label>
        </div>
      </div>

      {requiresB2BApproval && (
        <div className="border border-zinc-300 rounded p-4 space-y-3">
          <div className="text-sm text-zinc-700">
            This order requires B2B approval before placement.
          </div>
          <div className="text-xs text-zinc-600">
            Threshold: {approvalThreshold > 0 ? `${approvalThreshold} ${String(cart.currency_code || "SEK").toUpperCase()}` : "manual policy"}
            {" | "}
            Order total: {orderTotalMajor.toFixed(2)} {String(cart.currency_code || "SEK").toUpperCase()}
            {approvalId ? ` | Approval ID: ${approvalId}` : ""}
            {approvalStatus ? ` | Status: ${approvalStatus}` : ""}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={submitB2BApproval}
              disabled={submitB2BApprovalMutation.isPending}
            >
              {submitB2BApprovalMutation.isPending ? "Submitting..." : "Submit Approval"}
            </Button>
            {approvalMessage && (
              <span className="text-xs text-zinc-700">{approvalMessage}</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>

        <PaymentButton
          cart={cart}
          requireTermsAccepted
          termsAccepted={termsAccepted}
          forceDisabled={requiresB2BApproval && !isApprovalSatisfied}
          disabledMessage={
            requiresB2BApproval && !isApprovalSatisfied
              ? "Submit and complete B2B approval before placing this order."
              : undefined
          }
        />
      </div>
    </div>
  )
}

export default ReviewStep
