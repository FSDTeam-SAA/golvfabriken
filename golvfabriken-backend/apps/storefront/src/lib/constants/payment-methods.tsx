import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentMethodsData: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <Cash />,
  },
  pp_kustom_kustom: {
    title: "Kustom Checkout",
    icon: <CreditCard />,
  },
  pp_klarna_klarna: {
    title: "Klarna (Pay later, Slice it, Pay now)",
    icon: (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-[#FFB3C7] text-black tracking-tight">
        Klarna.
      </span>
    ),
  },
  pp_klarna: {
    title: "Klarna",
    icon: (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-[#FFB3C7] text-black tracking-tight">
        Klarna.
      </span>
    ),
  },
}