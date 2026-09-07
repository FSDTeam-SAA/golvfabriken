import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import KlarnaPaymentProviderService from "./services/klarna-payment-provider"

export default ModuleProvider(Modules.PAYMENT, {
  services: [KlarnaPaymentProviderService],
})
