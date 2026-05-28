import Medusa from "@medusajs/js-sdk"

const isBrowser = typeof window !== "undefined"

// On the server (SSR), prefer an internal URL if provided — this avoids
// SSR fetches making a public round-trip through Cloudflare back to our own
// origin. On the client, use the public URL baked into the Vite bundle.
let MEDUSA_BACKEND_URL = "http://localhost:9002"

if (!isBrowser && typeof process !== "undefined" && process.env?.MEDUSA_BACKEND_URL_INTERNAL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL_INTERNAL
} else if (import.meta.env.VITE_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env.DEV,
  publishableKey: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageKey: "medusa_auth_token",
    jwtTokenStorageMethod: isBrowser ? "local" : "memory",
  }
})
