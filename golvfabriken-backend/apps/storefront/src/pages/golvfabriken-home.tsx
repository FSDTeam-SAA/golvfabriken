import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/utils/sdk";
import { HeroSection } from "@/components/golvfabriken/hero-section";
import { TrustBar } from "@/components/golvfabriken/trust-bar";
import { CategoryGrid } from "@/components/golvfabriken/category-grid";
import { ProductSlider } from "@/components/golvfabriken/product-slider";
import { B2BSection } from "@/components/golvfabriken/b2b-section";
import { InfoSection } from "@/components/golvfabriken/info-section";

export default function GolvfabrikenHome() {
  const { data: regionsData } = useQuery({
    queryKey: ["homepage-regions"],
    queryFn: async () => {
      const response = await sdk.store.region.list({
        fields: "id,name,countries.iso_2",
      });
      return response;
    },
  });

  const regionId =
    regionsData?.regions.find((region) =>
      region.countries?.some((country) => country.iso_2 === "se")
    )?.id || regionsData?.regions[0]?.id;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const response = await sdk.store.category.list({
        fields: "id,name,handle,description",
      });
      return response;
    },
  });

  // Fetch products for sliders
  const { data: productsData } = useQuery({
    queryKey: ["homepage-products", regionId],
    queryFn: async () => {
      if (!regionId) {
        return { products: [] };
      }

      const response = await sdk.store.product.list({
        fields: "id,title,handle,thumbnail,variants.calculated_price,metadata",
        region_id: regionId,
        limit: 12,
      });
      return response;
    },
  });

  const categories = categoriesData?.product_categories || [];
  const products = productsData?.products || [];

  // Map categories for display with realistic images
  const categoryImages: Record<string, string> = {
    tragolv: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800",
    laminatgolv: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
    vinylgolv: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    klinkergolv: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    tillbehor: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
  };

  const displayCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    handle: cat.handle,
    description: cat.description || undefined,
    imageUrl: categoryImages[cat.handle] || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
  }));

  const trustItems = [
    {
      icon: "truck" as const,
      title: "Snabb leverans",
      description: "1-3 dagars leveranstid på lagervara",
    },
    {
      icon: "shield" as const,
      title: "Trygg e-handel",
      description: "14 dagars öppet köp och säker betalning",
    },
    {
      icon: "phone" as const,
      title: "Experthjälp",
      description: "Våra golvexperter hjälper dig välja rätt",
    },
    {
      icon: "award" as const,
      title: "Kvalitetsgaranti",
      description: "Endast högkvalitativa golv från ledande varumärken",
    },
  ];

  return (
    <div>
      <HeroSection
        title="Sveriges golvexperter online"
        subtitle="Stort utbud av trägolv, laminat, vinyl och kakel till bästa priser. Snabb leverans och expertråd."
        ctaText="Handla golv"
        ctaLink="/$countryCode/store"
        secondaryCta={{
          text: "Kontakta oss",
          link: "/$countryCode",
        }}
        backgroundImage="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80"
      />

      <TrustBar items={trustItems} />

      <CategoryGrid
        title="Hitta ditt perfekta golv"
        subtitle="Vi har ett brett sortiment för alla rum och stilar"
        categories={displayCategories.filter(c => c.handle !== "tillbehor")}
      />

      {products.length > 0 && (
        <ProductSlider
          title="Populära golv just nu"
          subtitle="Våra mest sålda produkter"
          products={products.slice(0, 8) as any}
          viewAllLink="/$countryCode/store"
          viewAllText="Se alla produkter"
        />
      )}

      <B2BSection />

      {products.length > 4 && (
        <ProductSlider
          title="Nya produkter"
          subtitle="Senaste tillskotten i vårt sortiment"
          products={products.slice(4, 12) as any}
          viewAllLink="/$countryCode/store"
          viewAllText="Se alla nyheter"
        />
      )}

      <InfoSection />
    </div>
  );
}
