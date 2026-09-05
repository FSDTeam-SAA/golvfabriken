import { Link } from "@tanstack/react-router";
import { ChevronRight } from "@medusajs/icons";

interface Product {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  variants: Array<{
    calculated_price?: {
      calculated_amount: number;
    };
  }>;
  metadata?: {
    badge?: string;
  };
}

interface ProductSliderProps {
  products: Product[];
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  countryCode?: string;
}

export function ProductSlider({
  products,
  title,
  subtitle,
  viewAllLink,
  viewAllText = "Se alla produkter",
  countryCode = "se",
}: ProductSliderProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="content-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="mb-2">{title}</h2>
            {subtitle && <p className="text-body-lg text-golvfabriken-graphite/70">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="btn-tertiary hidden sm:flex items-center gap-2"
            >
              {viewAllText}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.slice(0, 8).map((product) => {
            const price = product.variants[0]?.calculated_price?.calculated_amount;
            const badge = product.metadata?.badge as string | undefined;
            const m2PerPackage = (product.metadata as any)?.m2_per_package || 
                                 (product.variants[0]?.metadata as any)?.m2_per_package;
            const isFlooring = typeof m2PerPackage === "number" && m2PerPackage > 0;
            const pricePerM2 = isFlooring && price ? price / m2PerPackage : null;

            return (
              <Link
                key={product.id}
                to="/$countryCode/products/$handle"
                params={{ countryCode, handle: product.handle }}
                className="group card-gf overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-golvfabriken-beige-100">
                  {badge && (
                    <div className="absolute top-2 left-2 z-10 badge-sale">
                      {badge}
                    </div>
                  )}
                  <img
                    src={product.thumbnail || "https://placehold.co/400x400/f5f5f2/2c4a3b?text=Golv"}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-body font-semibold mb-1 line-clamp-2 group-hover:text-golvfabriken-green transition-colors">
                    {product.title}
                  </h3>
                  {price !== undefined && (
                    <div className="flex flex-col">
                      <p className="text-price-sm text-golvfabriken-green font-semibold">
                        {new Intl.NumberFormat("sv-SE", {
                          style: "currency",
                          currency: "SEK",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(price)}
                        {isFlooring && (
                          <span className="text-xs font-normal text-golvfabriken-graphite/60 ml-1">/ pkt</span>
                        )}
                      </p>
                      {isFlooring && pricePerM2 && (
                        <p className="text-xs font-medium text-golvfabriken-green/90">
                          {new Intl.NumberFormat("sv-SE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(pricePerM2)} kr/m²
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {viewAllLink && (
          <div className="mt-8 text-center sm:hidden">
            <Link to={viewAllLink} className="btn-primary">
              {viewAllText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
