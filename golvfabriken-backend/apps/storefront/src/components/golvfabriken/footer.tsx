import { Link } from "@tanstack/react-router";
import { Phone } from "@medusajs/icons";
import { Mail, MapPin } from "@/components/icons/custom-icons";

export function GolvfabrikenFooter() {
  const countryCode = "se";
  
  return (
    <footer className="bg-golvfabriken-graphite text-white">
      <div className="content-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About */}
          <div>
            <h3 className="text-h4 mb-4 text-white">Golvfabriken</h3>
            <p className="text-body-sm text-white/80 mb-4">
              Sveriges ledande golvbutik online. Vi erbjuder högkvalitativa golv till konkurrenskraftiga priser med snabb leverans.
            </p>
            <div className="space-y-2 text-body-sm text-white/80">
              <a
                href="tel:+46123456789"
                className="flex items-center gap-2 hover:text-golvfabriken-wood transition-colors"
              >
                <Phone className="w-4 h-4" />
                010-123 45 67
              </a>
              <a
                href="mailto:info@golvfabriken.se"
                className="flex items-center gap-2 hover:text-golvfabriken-wood transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@golvfabriken.se
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Golvgatan 123<br />123 45 Stockholm</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produkter</h4>
            <ul className="space-y-2 text-body-sm text-white/80">
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "tragolv" }}
                  className="hover:text-golvfabriken-wood transition-colors"
                >
                  Trägolv
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "laminatgolv" }}
                  className="hover:text-golvfabriken-wood transition-colors"
                >
                  Laminatgolv
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "vinylgolv" }}
                  className="hover:text-golvfabriken-wood transition-colors"
                >
                  Vinylgolv
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "klinkergolv" }}
                  className="hover:text-golvfabriken-wood transition-colors"
                >
                  Kakel & Klinker
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "tillbehor" }}
                  className="hover:text-golvfabriken-wood transition-colors"
                >
                  Tillbehör
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Kundservice</h4>
            <ul className="space-y-2 text-body-sm text-white/80">
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Kontakta oss
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Vanliga frågor
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Leveransinformation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Returer & Ångerrätt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Installationsguide
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Företag</h4>
            <ul className="space-y-2 text-body-sm text-white/80">
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Om oss
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  B2B & Projekt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Begär offert
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Volymrabatter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-golvfabriken-wood transition-colors">
                  Jobb hos oss
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} Golvfabriken. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-golvfabriken-wood transition-colors">
              Integritetspolicy
            </a>
            <a href="#" className="hover:text-golvfabriken-wood transition-colors">
              Köpvillkor
            </a>
            <a href="#" className="hover:text-golvfabriken-wood transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
