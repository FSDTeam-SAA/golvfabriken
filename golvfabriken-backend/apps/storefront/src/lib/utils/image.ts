const BACKEND_URL = (import.meta.env.VITE_MEDUSA_BACKEND_URL as string) || "http://localhost:9002"

export function normalizeImageUrl(url?: string | null): string {
  if (!url) return ""
  
  // Replace localhost:9000 default port with active backend port (9002)
  if (url.includes("localhost:9000")) {
    return url.replace("localhost:9000", BACKEND_URL.replace(/^https?:\/\//, ""))
  }

  // If it's a relative static path e.g. /static/...
  if (url.startsWith("/static/")) {
    return `${BACKEND_URL}${url}`
  }

  return url
}
