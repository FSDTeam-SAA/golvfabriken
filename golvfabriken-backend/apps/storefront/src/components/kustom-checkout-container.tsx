import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

interface KustomCheckoutContainerProps {
  paymentSession: HttpTypes.StorePaymentSession | null
  cart: HttpTypes.StoreCart
  onComplete?: () => void
}

declare global {
  interface Window {
    _klarnaCheckout?: (callback: (api: KlarnaCheckoutAPI) => void) => void
  }
}

interface KlarnaCheckoutAPI {
  suspend: () => void
  resume: () => void
}

const KustomCheckoutContainer = ({
  paymentSession,
  cart,
  onComplete,
}: KustomCheckoutContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentSession || !paymentSession.data) {
      setError("Payment session not initialized")
      return
    }

    const sessionData = paymentSession.data as any

    if (!sessionData.html_snippet) {
      setError("Kustom checkout snippet not available")
      return
    }

    if (containerRef.current) {
      try {
        // Clear previous content
        containerRef.current.innerHTML = ""

        // Inject the KCO iframe snippet
        const scriptContainer = document.createElement("div")
        scriptContainer.innerHTML = sessionData.html_snippet
        containerRef.current.appendChild(scriptContainer)

        setIsLoaded(true)
        setError(null)

        // Listen for Klarna Checkout events
        if (window._klarnaCheckout) {
          window._klarnaCheckout((api) => {
            // You can use api.suspend() and api.resume() for cart updates
          })
        }
      } catch (err) {
        setError("Failed to load Kustom checkout")
        console.error("Kustom checkout error:", err)
      }
    }
  }, [paymentSession])

  if (error) {
    return (
      <div className="text-rose-900 text-sm" role="alert">
        {error}
      </div>
    )
  }

  if (!paymentSession) {
    return (
      <div className="text-zinc-600 text-sm">
        Initializing Kustom checkout...
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        id="kustom-checkout-container"
        className="min-h-[600px]"
      />
      {!isLoaded && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
        </div>
      )}
    </div>
  )
}

export default KustomCheckoutContainer
