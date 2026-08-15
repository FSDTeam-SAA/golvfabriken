import ProductActions from "@/components/product-actions"
import { ProductSpecifications } from "@/components/product-specifications"
import { ImageGallery } from "@/components/ui/image-gallery"
import { useTranslation } from "@/lib/hooks/use-translation"
import { HttpTypes } from "@medusajs/types"
import { useLoaderData } from "@tanstack/react-router"

/**
 * Product Page Pattern
 *
 * Demonstrates:
 * - useLoaderData for SSR-loaded product, region, and CMS enrichment
 * - Product data structure (images, variants, options)
 * - ProductActions for variant selection + add to cart
 * - ImageGallery for product images
 *
 * Key interactions:
 * - Variant selection updates price display
 * - Add to cart with optimistic updates
 * - Stock checking per variant
 */
const ProductDetails = () => {
  const { t } = useTranslation()
  const { product, productEnrichment, region } = useLoaderData({
    from: "/$countryCode/products/$handle",
  })

  const cmsImages = productEnrichment?.mediaGallery?.map((image) => ({
    id: String(image.id),
    url: image.url,
  })) as HttpTypes.StoreProductImage[] | undefined

  const productImages: HttpTypes.StoreProductImage[] =
    cmsImages && cmsImages.length > 0
      ? cmsImages
      : product.images && product.images.length > 0
        ? product.images
        : product.thumbnail
          ? [{ id: "thumbnail", url: product.thumbnail } as HttpTypes.StoreProductImage]
          : []

  const displayDescription =
    productEnrichment?.shortDescription ||
    product.description

  return (
    <div className="content-container py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {productImages.length > 0 ? (
            <ImageGallery images={productImages} />
          ) : (
            <div className="aspect-[29/34] w-full bg-golvfabriken-beige-100 flex items-center justify-center">
              <p className="text-golvfabriken-graphite/50">
                {t("product.noImageAvailable")}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-golvfabriken-graphite mb-2">
              {product.title}
            </h1>
            {displayDescription && (
              <p className="text-golvfabriken-graphite/70 text-base leading-relaxed">
                {displayDescription}
              </p>
            )}
          </div>

          <ProductActions product={product} region={region} />
        </div>
      </div>

      {productEnrichment?.longDescription && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-golvfabriken-graphite mb-4">
            {t("product.description")}
          </h2>
          <div className="max-w-3xl whitespace-pre-line text-golvfabriken-graphite/75 leading-relaxed">
            {productEnrichment.longDescription}
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-golvfabriken-graphite mb-6">
          {t("product.specifications")}
        </h2>
        <ProductSpecifications
          metadata={product.metadata}
          product={{
            material: product.material,
            weight: product.weight,
            length: product.length,
            width: product.width,
            height: product.height,
          }}
        />
      </div>
    </div>
  )
}

export default ProductDetails
