import GolvfabrikenHome from "@/pages/golvfabriken-home"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { listCategories } from "@/lib/data/categories"
import { queryKeys } from "@/lib/utils/query-keys"

export const Route = createFileRoute("/$countryCode/")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    // Fetch region for the country code
    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    // Prefetch categories and products for homepage
    queryClient.prefetchQuery({
      queryKey: ["categories-list"],
      queryFn: () => listCategories(),
    })

    queryClient.prefetchQuery({
      queryKey: ["homepage-products"],
      queryFn: () =>
        listProducts({
          query_params: {
            limit: 12,
            fields: "*variants, +variants.calculated_price, *metadata, +variants.metadata, *thumbnail"
          },
          region_id: region.id,
        }),
    })

    return {
      countryCode,
      region,
    }
  },
  head: () => {
    const title = `Golvfabriken - Sveriges golvexperter online | Trägolv, Laminat & Vinyl`
    const description = `Handla högkvalitativa golv online. Stort sortiment av trägolv, laminat, vinyl och kakel. Snabb leverans, låga priser och experthjälp. Fri frakt över 5000 kr.`

    return {
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        {
          name: "keywords",
          content: "trägolv, laminatgolv, vinylgolv, kakel, klinker, golv online, golvbutik, parkettgolv, golvtillbehör",
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:locale",
          content: "sv_SE",
        },
        {
          property: "twitter:card",
          content: "summary_large_image",
        },
        {
          property: "twitter:title",
          content: title,
        },
        {
          property: "twitter:description",
          content: description,
        },
      ]
    }
  },
  component: GolvfabrikenHome,
})
