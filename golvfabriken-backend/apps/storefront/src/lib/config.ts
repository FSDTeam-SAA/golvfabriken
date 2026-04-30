import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

const ensureStorageApi = () => {
  const memoryStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  }

  const targets = [globalThis as any]

  if (typeof window !== "undefined") {
    targets.push(window)
  }

  targets.forEach((target) => {
    ;(["localStorage", "sessionStorage"] as const).forEach((storageKey) => {
      const storage = target[storageKey]

      if (!storage || typeof storage.getItem !== "function") {
        Object.defineProperty(target, storageKey, {
          value: memoryStorage,
          configurable: true,
        })
      }
    })
  })
}

ensureStorageApi()

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "memory",
  },
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
