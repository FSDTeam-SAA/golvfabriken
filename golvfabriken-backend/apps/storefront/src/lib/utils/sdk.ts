import Medusa from "@medusajs/js-sdk"

const isBrowser = typeof window !== "undefined"

// SSR (running inside the Docker container) must use the internal Docker
// network hostname to reach Medusa — the public URL either doesn't resolve
// from inside the container (localhost) or adds an unnecessary round-trip
// through Cloudflare (which triggers Cloudflare Bot Challenge / 403 on SSR requests).
// Browser-side code must use the public URL since it runs on the user's machine.
//
// NOTE: Use globalThis.process?.env?.["MEDUSA_BACKEND_URL_INTERNAL"] to prevent Vite
// from statically replacing it with `undefined` at build time.
const internalBackendUrl = !isBrowser
  ? globalThis.process?.env?.["MEDUSA_BACKEND_URL_INTERNAL"]
  : undefined

const MEDUSA_BACKEND_URL =
  internalBackendUrl ||
  (import.meta.env.VITE_MEDUSA_BACKEND_URL as string) ||
  "http://localhost:9002"

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
