export type ProductRobots =
  | "index_follow"
  | "index_nofollow"
  | "noindex_follow"
  | "noindex_nofollow"

export type ProductVisibility = "public" | "b2b_only" | "private"

export interface ProductEnrichmentMedia {
  id: number | string
  url: string
  alternativeText?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
}

export interface ProductEnrichment {
  id: number | string
  documentId?: string
  medusaId?: string
  slug: string
  sku?: string
  commerceTitle?: string
  shortDescription?: string
  longDescription?: string
  seoTitle?: string
  seoDescription?: string
  focusKeyphrase?: string
  canonicalUrl?: string
  robots?: ProductRobots
  ogImage?: ProductEnrichmentMedia | null
  mediaGallery: ProductEnrichmentMedia[]
  videoUrl?: string
  productVisibility?: ProductVisibility
  priceDisplay?: string
  inventoryStatus?: string
  syncStatus?: string
  lastSyncedAt?: string
}

type StrapiEntity<TAttributes> = {
  id: number | string
  documentId?: string
  attributes?: TAttributes
} & Partial<TAttributes>

type StrapiMediaAttributes = {
  url?: string
  alternativeText?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
}

type StrapiMediaEntity = StrapiEntity<StrapiMediaAttributes>

type StrapiMediaRelation =
  | { data?: StrapiMediaEntity | StrapiMediaEntity[] | null }
  | StrapiMediaEntity
  | StrapiMediaEntity[]
  | null

type ProductEnrichmentAttributes = {
  medusa_id?: string
  slug?: string
  sku?: string
  commerce_title?: string
  short_description?: string
  long_description?: string
  seo_title?: string
  seo_description?: string
  focus_keyphrase?: string
  canonical_url?: string
  robots?: ProductRobots
  og_image?: StrapiMediaRelation
  media_gallery?: StrapiMediaRelation
  video_url?: string
  product_visibility?: ProductVisibility
  price_display?: string
  inventory_status?: string
  sync_status?: string
  last_synced_at?: string
}

type StrapiListResponse<TAttributes> = {
  data?: Array<StrapiEntity<TAttributes>>
}

const getStrapiBaseUrl = () =>
  (import.meta.env.VITE_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "")

const getStrapiToken = () => import.meta.env.VITE_STRAPI_API_TOKEN

const getAttributes = <TAttributes>(
  entity: StrapiEntity<TAttributes>
): TAttributes => {
  return (entity.attributes ?? entity) as TAttributes
}

const getMediaEntityAttributes = (
  entity: StrapiMediaEntity
): StrapiMediaAttributes => {
  return getAttributes<StrapiMediaAttributes>(entity)
}

const getAbsoluteMediaUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  return `${getStrapiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`
}

const normalizeMedia = (
  relation: StrapiMediaRelation
): ProductEnrichmentMedia[] => {
  if (!relation) {
    return []
  }

  const rawData = Array.isArray(relation)
    ? relation
    : "data" in relation
      ? relation.data
      : relation

  const entities = Array.isArray(rawData) ? rawData : rawData ? [rawData] : []

  return entities.flatMap((entity) => {
    const attributes = getMediaEntityAttributes(entity)

    if (!attributes.url) {
      return []
    }

    return [{
      id: entity.id,
      url: getAbsoluteMediaUrl(attributes.url),
      alternativeText: attributes.alternativeText,
      caption: attributes.caption,
      width: attributes.width,
      height: attributes.height,
    }]
  })
}

const resolveLocale = (countryCode?: string) => {
  return countryCode?.toLowerCase() === "se" ? "sv" : "en"
}

export const retrieveProductEnrichment = async ({
  slug,
  medusaId,
  sku,
  countryCode,
}: {
  slug?: string
  medusaId?: string
  sku?: string
  countryCode?: string
}): Promise<ProductEnrichment | null> => {
  if (!slug && !medusaId && !sku) {
    return null
  }

  const params = new URLSearchParams()
  params.set("pagination[limit]", "1")
  params.set("publicationState", "live")
  params.set("locale", resolveLocale(countryCode))
  params.set("populate[media_gallery]", "true")
  params.set("populate[og_image]", "true")

  if (slug) {
    params.set("filters[slug][$eq]", slug)
  } else if (medusaId) {
    params.set("filters[medusa_id][$eq]", medusaId)
  } else if (sku) {
    params.set("filters[sku][$eq]", sku)
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    }

    const token = getStrapiToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(
      `${getStrapiBaseUrl()}/api/product-enrichments?${params.toString()}`,
      { headers }
    )

    if (!response.ok) {
      return null
    }

    const payload = await response.json() as StrapiListResponse<ProductEnrichmentAttributes>
    const entity = payload.data?.[0]

    if (!entity) {
      return null
    }

    const attributes = getAttributes<ProductEnrichmentAttributes>(entity)
    const mediaGallery = normalizeMedia(attributes.media_gallery)
    const ogImage = normalizeMedia(attributes.og_image)[0] ?? null

    return {
      id: entity.id,
      documentId: entity.documentId,
      medusaId: attributes.medusa_id,
      slug: attributes.slug ?? slug ?? "",
      sku: attributes.sku,
      commerceTitle: attributes.commerce_title,
      shortDescription: attributes.short_description,
      longDescription: attributes.long_description,
      seoTitle: attributes.seo_title,
      seoDescription: attributes.seo_description,
      focusKeyphrase: attributes.focus_keyphrase,
      canonicalUrl: attributes.canonical_url,
      robots: attributes.robots,
      ogImage,
      mediaGallery,
      videoUrl: attributes.video_url,
      productVisibility: attributes.product_visibility,
      priceDisplay: attributes.price_display,
      inventoryStatus: attributes.inventory_status,
      syncStatus: attributes.sync_status,
      lastSyncedAt: attributes.last_synced_at,
    }
  } catch {
    return null
  }
}
