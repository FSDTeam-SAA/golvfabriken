import Medusa from "@medusajs/js-sdk"

const isBrowser = typeof window !== "undefined"

// SSR (running inside the Docker container) must use the internal Docker
// network hostname to reach Medusa — the public URL either doesn't resolve
// from inside the container (localhost) or adds an unnecessary round-trip
// through Cloudflare. Browser-side code must use the public URL since it
// runs on the user's machine, outside the Docker network.
let MEDUSA_BACKEND_URL = "http://localhost:9002"

if (!isBrowser && process.env.MEDUSA_BACKEND_URL_INTERNAL) {
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
