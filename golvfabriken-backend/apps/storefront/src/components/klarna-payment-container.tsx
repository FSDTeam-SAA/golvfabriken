import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

interface KlarnaPaymentContainerProps {
  paymentSession: HttpTypes.StorePaymentSession | null
  cart: HttpTypes.StoreCart
  onLoaded?: () => void
}

declare global {
  interface Window {
    Klarna?: {
      Payments: {
        init: (options: { client_token: string }) => void
        load: (
          options: {
            container: string
            payment_method_category?: string
            payment_method_categories?: string[]
          },
          data?: Record<string, unknown>,
          callback?: (response: { show_form?: boolean; error?: unknown }) => void
        ) => void
        authorize: (
          options: {
            payment_method_category?: string
            auto_finalize?: boolean
          },
          data?: Record<string, unknown>,
          callback?: (response: {
            approved: boolean
            authorization_token?: string
            show_form?: boolean
            error?: unknown
          }) => void
        ) => void
      }
    }
  }
}

const KlarnaPaymentContainer = ({
  paymentSession,
  cart,
  onLoaded,
}: KlarnaPaymentContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSdkLoaded, setIsSdkLoaded] = useState(false)
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionData = (paymentSession?.data || {}) as Record<string, unknown>
  const clientToken = String(sessionData.client_token || "")

  // 1. Load Klarna JS SDK
  useEffect(() => {
    if (window.Klarna?.Payments) {
      setIsSdkLoaded(true)
      return
    }

    const scriptId = "klarna-payments-sdk"
    let script = document.getElementById(scriptId) as HTMLScriptElement

    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js"
      script.async = true
      script.onload = () => {
        setIsSdkLoaded(true)
      }
      script.onerror = () => {
        setError("Failed to load Klarna SDK.")
      }
      document.body.appendChild(script)
    } else {
      setIsSdkLoaded(true)
    }
  }, [])

  // 2. Initialize and load the widget when SDK and client_token are ready
  useEffect(() => {
    if (!isSdkLoaded || !clientToken || !window.Klarna?.Payments) {
      return
    }

    try {
      window.Klarna.Payments.init({
        client_token: clientToken,
      })

      const categories = sessionData.payment_method_categories as Array<{ identifier: string }> | undefined
      const category = categories?.[0]?.identifier || "klarna"

      window.Klarna.Payments.load(
        {
          container: "#klarna-payments-container",
          payment_method_category: category,
        },
        {},
        (response) => {
          if (response?.show_form !== false) {
            setIsWidgetLoaded(true)
            onLoaded?.()
          } else {
            // Widget loaded
            setIsWidgetLoaded(true)
          }
        }
      )
    } catch (err) {
      console.warn("Klarna widget load notice:", err)
      setIsWidgetLoaded(true)
    }
  }, [isSdkLoaded, clientToken, onLoaded])

  return (
    <div className="w-full mt-4 p-4 rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#FFB3C7] text-black font-bold text-xs">
            Klarna.
          </span>
          <span className="text-sm font-medium text-zinc-900">
            Betala med Klarna (Få först. Betala sen. / Dela upp / Direktbetalning)
          </span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-rose-600 mb-3">{error}</div>
      )}

      {/* Klarna SDK DOM mount point */}
      <div
        id="klarna-payments-container"
        ref={containerRef}
        className="min-h-[120px]"
      />

      <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-600 space-y-1">
        <div className="font-semibold text-zinc-800">🧪 Klarna Playground Testläge:</div>
        <div>1. Klicka på <strong>Nästa</strong> nedan för att gå till <strong>Granska & slutför</strong>.</div>
        <div>2. Klicka på <strong>Betala med Klarna</strong> för att öppna Klarnas betalningsdialog.</div>
        <div>3. Ange testdata (t.ex. BankID/Personnummer: <code>19900101-0101</code>, SMS: <code>123456</code>).</div>
      </div>

      {!isWidgetLoaded && !error && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 py-4 justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900" />
          <span>Laddar Klarna betalningsalternativ...</span>
        </div>
      )}
    </div>
  )
}

export default KlarnaPaymentContainer
