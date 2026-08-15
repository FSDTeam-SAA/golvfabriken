export const PRODUCT_METADATA_KEYS = {
  unit: "unit",
  m2PerPackage: "m2_per_package",
  wastePct: "waste_pct",
  thickness: "thickness",
  wearClass: "wear_class",
  packageSize: "package_size",
  installation: "installation",
  shippingClass: "shipping_class",
  hsCode: "hs_code",
  countryOfOrigin: "country_of_origin",
  dangerousGoodsLq: "dangerous_goods_lq",
  shipmentType: "shipment_type",
  palletType: "pallet_type",
  palletCount: "pallet_count",
  stackable: "stackable",
  loadingMeters: "loading_meters",
  componentBreakdown: "component_breakdown",
} as const

export type ProductMetadata = Record<string, unknown> | null | undefined

export interface FlooringProductMetadata {
  unit: string
  m2PerPackage: number | null
  wastePct: number | null
  thickness?: string
  wearClass?: string
  packageSize?: string
  installation?: string
}

export interface ShippingProductMetadata {
  shippingClass?: string
  hsCode?: string
  countryOfOrigin?: string
  dangerousGoodsLq: boolean
  shipmentType?: string
  palletType?: string
  palletCount?: number
  stackable?: boolean
  loadingMeters?: number
  componentBreakdown?: unknown
}

const getMetadataValue = (
  productMetadata: ProductMetadata,
  variantMetadata: ProductMetadata,
  key: string
) => {
  if (variantMetadata?.[key] != null) {
    return variantMetadata[key]
  }

  return productMetadata?.[key]
}

export const getMetadataString = (
  productMetadata: ProductMetadata,
  variantMetadata: ProductMetadata,
  key: string
) => {
  const value = getMetadataValue(productMetadata, variantMetadata, key)

  if (typeof value === "string") {
    return value.trim() || undefined
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return undefined
}

export const getMetadataNumber = (
  productMetadata: ProductMetadata,
  variantMetadata: ProductMetadata,
  key: string
) => {
  const value = getMetadataValue(productMetadata, variantMetadata, key)
  const parsed = typeof value === "number" ? value : Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

export const getMetadataBoolean = (
  productMetadata: ProductMetadata,
  variantMetadata: ProductMetadata,
  key: string
) => {
  const value = getMetadataValue(productMetadata, variantMetadata, key)

  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    return ["true", "yes", "1", "ja"].includes(value.toLowerCase())
  }

  if (typeof value === "number") {
    return value === 1
  }

  return false
}

const normalizeWastePct = (value: number | null) => {
  if (!value) {
    return null
  }

  return [5, 10, 15].includes(value) ? value : null
}

const positiveNumberOrNull = (value: number | null) => {
  return value && value > 0 ? value : null
}

export const getFlooringProductMetadata = (
  productMetadata?: ProductMetadata,
  variantMetadata?: ProductMetadata
): FlooringProductMetadata => {
  return {
    unit: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.unit
    ) || "M2",
    m2PerPackage: positiveNumberOrNull(getMetadataNumber(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.m2PerPackage
    )),
    wastePct: normalizeWastePct(getMetadataNumber(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.wastePct
    )),
    thickness: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.thickness
    ),
    wearClass: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.wearClass
    ),
    packageSize: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.packageSize
    ),
    installation: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.installation
    ),
  }
}

export const getShippingProductMetadata = (
  productMetadata?: ProductMetadata,
  variantMetadata?: ProductMetadata
): ShippingProductMetadata => {
  return {
    shippingClass: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.shippingClass
    ),
    hsCode: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.hsCode
    ),
    countryOfOrigin: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.countryOfOrigin
    ),
    dangerousGoodsLq: getMetadataBoolean(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.dangerousGoodsLq
    ),
    shipmentType: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.shipmentType
    ),
    palletType: getMetadataString(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.palletType
    ),
    palletCount: positiveNumberOrNull(getMetadataNumber(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.palletCount
    )) ?? undefined,
    stackable: getMetadataBoolean(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.stackable
    ),
    loadingMeters: positiveNumberOrNull(getMetadataNumber(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.loadingMeters
    )) ?? undefined,
    componentBreakdown: getMetadataValue(
      productMetadata,
      variantMetadata,
      PRODUCT_METADATA_KEYS.componentBreakdown
    ),
  }
}
