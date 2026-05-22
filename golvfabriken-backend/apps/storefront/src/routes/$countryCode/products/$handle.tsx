import { listProducts, retrieveProduct } from "@/lib/data/products";
import { retrieveProductEnrichment } from "@/lib/data/product-enrichment";
import { getRegion } from "@/lib/data/regions";
import { queryKeys } from "@/lib/utils/query-keys";
import { sanitize } from "@/lib/utils/sanitize";
import ProductDetails from "@/pages/product";
import { HttpTypes } from "@medusajs/types";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/$countryCode/products/$handle")({
  loader: async ({ params, context }) => {
    const { countryCode, handle } = params;
    const { queryClient } = context;

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    });

    if (!region || !handle) {
      throw notFound();
    }

    // Single comprehensive product fetch with all needed fields
    const product = await queryClient.ensureQueryData({
      queryKey: ["product", handle, region.id],
      queryFn: async () => {
        try {
          return await retrieveProduct({
            handle,
            region_id: region.id,
            fields:
              "*variants, +variants.inventory_quantity, +variants.manage_inventory, +variants.allow_backorder, +variants.calculated_price, *images, *options, *options.values, *collection, *tags, *metadata, +variants.metadata",
          });
        } catch {
          throw notFound();
        }
      },
    });

    const productEnrichment = await queryClient.ensureQueryData({
      queryKey: queryKeys.products.enrichment(handle, countryCode),
      queryFn: () => retrieveProductEnrichment({
        slug: product.handle,
        medusaId: product.id,
        sku: product.variants?.[0]?.sku,
        countryCode,
      }),
    });

    // Ensure related products are loaded for SSR to prevent hydration mismatch
    // This ensures consistent rendering between server and client
    await queryClient.ensureQueryData({
      queryKey: queryKeys.products.related(product.id, region.id),
      queryFn: async () => {
        const params: HttpTypes.StoreProductListParams = {
          fields: "title, handle, *thumbnail, *variants",
          is_giftcard: false,
          limit: 4,
        };

        if (product.collection_id) {
          params.collection_id = [product.collection_id];
        }

        if (product.tags && product.tags.length > 0) {
          params.tag_id = product.tags.map((tag) => tag.id);
        }

        const { products } = await listProducts({
          query_params: params,
          region_id: region.id,
        });

        return products.filter((p) => p.id !== product.id);
      },
    });

    return sanitize({
      countryCode,
      region,
      product: product as HttpTypes.StoreProduct,
      productEnrichment,
    });
  },
  head: ({ loaderData }) => {
    const { product, productEnrichment, region } = loaderData || {};

    if (!product) {
      return {
        meta: [
          {
            title: "Product Not Found | Medusa Store",
          },
        ],
      };
    }

    const title = productEnrichment?.seoTitle || product.title;
    const description =
      productEnrichment?.seoDescription ||
      productEnrichment?.shortDescription ||
      product.description ||
      "Product details";
    const ogImage = productEnrichment?.ogImage?.url || product.thumbnail || "";
    const robots = productEnrichment?.robots?.replace("_", ",") || undefined;

    // Create structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description,
      image: product.images?.map((img: { url: string }) => img.url).filter(Boolean) || [],
      brand: {
        "@type": "Brand",
        name: "Golvfabriken",
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: region?.currency_code?.toUpperCase(),
        price: product.variants?.[0]?.calculated_price?.calculated_amount
          ? product.variants[0].calculated_price.calculated_amount.toFixed(2)
          : undefined,
      },
    };

    // Get first product image for preloading (critical for LCP)
    const firstImageUrl =
      productEnrichment?.ogImage?.url ||
      productEnrichment?.mediaGallery?.[0]?.url ||
      product.images?.[0]?.url ||
      product.thumbnail;

    return {
      meta: [
        {
          title: `${title} | Golvfabriken`,
        },
        {
          name: "description",
          content: description,
        },
        ...(robots
          ? [{
              name: "robots",
              content: robots,
            }]
          : []),
        {
          property: "og:site_name",
          content: "Golvfabriken",
        },
        {
          property: "og:title",
          content: `${title} | Golvfabriken`,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:image",
          content: ogImage,
        },
      ],
      links: [
        ...(firstImageUrl
          ? [
              {
                rel: "preload",
                href: firstImageUrl,
                as: "image",
                fetchPriority: "high",
              },
            ]
          : []),
        ...(productEnrichment?.canonicalUrl
          ? [
              {
                rel: "canonical",
                href: productEnrichment.canonicalUrl,
              },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
        },
      ],
    };
  },
  component: ProductDetails,
});
