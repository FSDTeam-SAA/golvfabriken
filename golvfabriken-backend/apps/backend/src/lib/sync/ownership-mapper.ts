import { createCorrelationId } from "./events";

type MedusaProductVariantLike = {
  id?: string;
  sku?: string | null;
  inventory_quantity?: number | null;
};

type MedusaProductLike = {
  id: string;
  handle?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  status?: string | null;
  variants?: MedusaProductVariantLike[] | null;
  metadata?: Record<string, unknown> | null;
};

type StrapiProductEnrichmentLike = {
  id?: string | number;
  documentId?: string;
  medusa_id?: string;
  slug?: string;
  commerce_title?: string;
  short_description?: string;
  long_description?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  robots?: string;
  product_visibility?: string;
  sync_origin?: string;
  sync_correlation_id?: string;
};

type MedusaProductUpdateInput = {
  id: string;
  handle?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

type StrapiProductEnrichmentUpsertInput = {
  medusa_id: string;
  slug: string;
  sku?: string;
  commerce_title?: string;
  short_description?: string;
  long_description?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  robots?: string;
  product_visibility?: "public" | "private";
  inventory_status?: "in_stock" | "out_of_stock";
  sync_origin: "medusa";
  sync_correlation_id: string;
  last_synced_at: string;
  last_synced_by: string;
  sync_status: "pending";
  last_error: null;
};

const toStringOrUndefined = (value: unknown) => {
  if (value == null) {
    return undefined;
  }

  const normalized = String(value).trim();

  return normalized || undefined;
};

const withoutUndefined = <T extends Record<string, unknown>>(input: T) => {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

const getDefaultSlug = (product: MedusaProductLike) => {
  return (
    toStringOrUndefined(product.handle) ||
    toStringOrUndefined(product.id) ||
    `product-${Date.now()}`
  );
};

const normalizeProductVisibility = (status?: string | null) => {
  const normalized = (status || "").toLowerCase();

  return normalized === "published" ? "public" : "private";
};

const normalizeInventoryStatus = (
  variants: MedusaProductVariantLike[] | null | undefined
) => {
  const hasInStock = (variants || []).some((variant) => {
    return Number(variant.inventory_quantity || 0) > 0;
  });

  return hasInStock ? "in_stock" : "out_of_stock";
};

export const mapMedusaProductToStrapiEnrichmentInput = ({
  product,
  correlationId,
}: {
  product: MedusaProductLike;
  correlationId?: string;
}): StrapiProductEnrichmentUpsertInput => {
  const metadata = product.metadata || {};

  return withoutUndefined({
    medusa_id: product.id,
    slug: getDefaultSlug(product),
    sku:
      toStringOrUndefined(product.variants?.[0]?.sku) ||
      toStringOrUndefined(metadata.sku),
    commerce_title: toStringOrUndefined(product.title),
    short_description:
      toStringOrUndefined(product.subtitle) ||
      toStringOrUndefined(product.description),
    long_description: toStringOrUndefined(product.description),
    seo_title:
      toStringOrUndefined(metadata.seo_title) ||
      toStringOrUndefined(product.title),
    seo_description:
      toStringOrUndefined(metadata.seo_description) ||
      toStringOrUndefined(product.subtitle) ||
      toStringOrUndefined(product.description),
    canonical_url: toStringOrUndefined(metadata.canonical_url),
    robots: toStringOrUndefined(metadata.robots) || "index_follow",
    product_visibility: normalizeProductVisibility(product.status),
    inventory_status: normalizeInventoryStatus(product.variants),
    sync_origin: "medusa",
    sync_correlation_id: correlationId || createCorrelationId(),
    last_synced_at: new Date().toISOString(),
    last_synced_by: "medusa-sync-subscriber",
    sync_status: "pending",
    last_error: null,
  }) as StrapiProductEnrichmentUpsertInput;
};

const normalizeStrapiVisibilityToProductStatus = (visibility?: string) => {
  return visibility === "public" ? "published" : "draft";
};

export const mapStrapiEnrichmentToMedusaProductUpdate = ({
  entry,
  correlationId,
}: {
  entry: StrapiProductEnrichmentLike;
  correlationId?: string;
}): MedusaProductUpdateInput | null => {
  const medusaId = toStringOrUndefined(entry.medusa_id);

  if (!medusaId) {
    return null;
  }

  const metadata: Record<string, unknown> = withoutUndefined({
    seo_title: toStringOrUndefined(entry.seo_title),
    seo_description: toStringOrUndefined(entry.seo_description),
    canonical_url: toStringOrUndefined(entry.canonical_url),
    robots: toStringOrUndefined(entry.robots),
    strapi_document_id: toStringOrUndefined(entry.documentId || entry.id),
    sync_origin: "strapi",
    sync_correlation_id: correlationId || createCorrelationId(),
    strapi_sync_status: "pending",
  });

  return withoutUndefined({
    id: medusaId,
    handle: toStringOrUndefined(entry.slug),
    title: toStringOrUndefined(entry.commerce_title),
    subtitle: toStringOrUndefined(entry.short_description),
    description:
      toStringOrUndefined(entry.long_description) ||
      toStringOrUndefined(entry.short_description),
    status: normalizeStrapiVisibilityToProductStatus(entry.product_visibility),
    metadata,
  }) as MedusaProductUpdateInput;
};
