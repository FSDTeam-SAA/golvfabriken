import { Link } from "@tanstack/react-router";

interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string;
  imageUrl: string;
}

interface CategoryGridProps {
  categories: Category[];
  title: string;
  subtitle?: string;
  countryCode?: string;
}

export function CategoryGrid({ categories, title, subtitle, countryCode = "se" }: CategoryGridProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="content-container">
        <div className="text-center mb-12">
          <h2 className="mb-4">{title}</h2>
          {subtitle && <p className="text-body-lg text-golvfabriken-graphite/70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/$countryCode/categories/$handle"
              params={{ countryCode, handle: category.handle }}
              className="group card-gf overflow-hidden"
            >
              <div className="aspect-[4/3] overflow-hidden bg-golvfabriken-beige-100">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-h4 mb-1 group-hover:text-golvfabriken-green transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-body-sm text-golvfabriken-graphite/60 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
