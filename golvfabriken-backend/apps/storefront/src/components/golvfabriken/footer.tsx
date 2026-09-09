import { Link, useLocation } from "@tanstack/react-router";
import { Phone } from "@medusajs/icons";
import { Mail, MapPin, Shield } from "@/components/icons/custom-icons";
import { getCountryCodeFromPath } from "@/lib/utils/region";
import { useState } from "react";
import clsx from "clsx";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GolvfabrikenFooter() {
  const location = useLocation();
  const countryCode = getCountryCodeFromPath(location.pathname) || "se";

  // State to manage mobile accordion collapse/expand
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    products: false,
    customerService: false,
    company: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <footer className="bg-golvfabriken-graphite text-white">
      <div className="content-container py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 md:mb-12">
          {/* About & Contact */}
          <div className="pb-6 md:pb-0 border-b border-white/10 md:border-none">
            <h3 className="text-h4 sm:text-h3 md:text-h4 mb-3 text-white font-semibold tracking-tight">
              Golvfabriken
            </h3>
            <p className="text-body-sm text-white/80 mb-5 leading-relaxed max-w-sm">
              Sveriges ledande golvbutik online. Vi erbjuder högkvalitativa golv till konkurrenskraftiga priser med snabb och trygg leverans.
            </p>
            <div className="space-y-2 text-body-sm text-white/85">
              <a
                href="tel:+46123456789"
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-white/5 hover:text-golvfabriken-wood transition-colors min-h-[44px] sm:min-h-0"
                aria-label="Ring kundtjänst: 010-123 45 67"
              >
                <Phone className="w-4 h-4 flex-shrink-0 text-golvfabriken-wood" />
                <span>010-123 45 67</span>
              </a>
              <a
                href="mailto:info@golvfabriken.se"
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-white/5 hover:text-golvfabriken-wood transition-colors min-h-[44px] sm:min-h-0"
                aria-label="Skicka e-post: info@golvfabriken.se"
              >
                <Mail className="w-4 h-4 flex-shrink-0 text-golvfabriken-wood" />
                <span>info@golvfabriken.se</span>
              </a>
              <div className="flex items-start gap-3 py-1.5 px-2 -mx-2 text-white/70">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-golvfabriken-wood" />
                <span>
                  Golvgatan 123
                  <br />
                  123 45 Stockholm
                </span>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="border-b border-white/10 md:border-none">
            <button
              type="button"
              onClick={() => toggleSection("products")}
              className="w-full flex items-center justify-between py-3.5 md:py-0 text-left md:pointer-events-none group"
              aria-expanded={openSections.products}
            >
              <h4 className="font-semibold text-white text-base md:text-h4 md:mb-4 group-hover:text-golvfabriken-wood md:group-hover:text-white transition-colors">
                Produkter
              </h4>
              <ChevronDownIcon
                className={clsx(
                  "w-5 h-5 text-white/60 transition-transform duration-200 md:hidden",
                  openSections.products && "rotate-180 text-white"
                )}
              />
            </button>
            <div
              className={clsx(
                "md:block pb-4 md:pb-0",
                openSections.products ? "block" : "hidden"
              )}
            >
              <ul className="space-y-1 md:space-y-2 text-body-sm text-white/80 pt-1 md:pt-0">
                <li>
                  <Link
                    to="/$countryCode/categories/$handle"
                    params={{ countryCode, handle: "tragolv" }}
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Trägolv
                  </Link>
                </li>
                <li>
                  <Link
                    to="/$countryCode/categories/$handle"
                    params={{ countryCode, handle: "laminatgolv" }}
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Laminatgolv
                  </Link>
                </li>
                <li>
                  <Link
                    to="/$countryCode/categories/$handle"
                    params={{ countryCode, handle: "vinylgolv" }}
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Vinylgolv
                  </Link>
                </li>
                <li>
                  <Link
                    to="/$countryCode/categories/$handle"
                    params={{ countryCode, handle: "klinkergolv" }}
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Kakel &amp; Klinker
                  </Link>
                </li>
                <li>
                  <Link
                    to="/$countryCode/categories/$handle"
                    params={{ countryCode, handle: "tillbehor" }}
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Tillbehör
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Customer Service Section */}
          <div className="border-b border-white/10 md:border-none">
            <button
              type="button"
              onClick={() => toggleSection("customerService")}
              className="w-full flex items-center justify-between py-3.5 md:py-0 text-left md:pointer-events-none group"
              aria-expanded={openSections.customerService}
            >
              <h4 className="font-semibold text-white text-base md:text-h4 md:mb-4 group-hover:text-golvfabriken-wood md:group-hover:text-white transition-colors">
                Kundservice
              </h4>
              <ChevronDownIcon
                className={clsx(
                  "w-5 h-5 text-white/60 transition-transform duration-200 md:hidden",
                  openSections.customerService && "rotate-180 text-white"
                )}
              />
            </button>
            <div
              className={clsx(
                "md:block pb-4 md:pb-0",
                openSections.customerService ? "block" : "hidden"
              )}
            >
              <ul className="space-y-1 md:space-y-2 text-body-sm text-white/80 pt-1 md:pt-0">
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Kontakta oss
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Vanliga frågor (FAQ)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Leveransinformation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Returer &amp; Ångerrätt
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Installationsguide
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Company Section */}
          <div className="border-b border-white/10 md:border-none">
            <button
              type="button"
              onClick={() => toggleSection("company")}
              className="w-full flex items-center justify-between py-3.5 md:py-0 text-left md:pointer-events-none group"
              aria-expanded={openSections.company}
            >
              <h4 className="font-semibold text-white text-base md:text-h4 md:mb-4 group-hover:text-golvfabriken-wood md:group-hover:text-white transition-colors">
                Företag
              </h4>
              <ChevronDownIcon
                className={clsx(
                  "w-5 h-5 text-white/60 transition-transform duration-200 md:hidden",
                  openSections.company && "rotate-180 text-white"
                )}
              />
            </button>
            <div
              className={clsx(
                "md:block pb-4 md:pb-0",
                openSections.company ? "block" : "hidden"
              )}
            >
              <ul className="space-y-1 md:space-y-2 text-body-sm text-white/80 pt-1 md:pt-0">
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Om oss
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    B2B &amp; Projekt
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Begär offert
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Volymrabatter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="block py-2 md:py-1 px-1 -mx-1 rounded hover:text-golvfabriken-wood hover:bg-white/5 md:hover:bg-transparent transition-colors"
                  >
                    Jobba hos oss
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trust & Payment badges */}
        <div className="pt-6 pb-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="w-4 h-4 text-golvfabriken-wood flex-shrink-0" />
            <span>Trygg e-handel &amp; säkra betalningar</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-white/80">
            <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-semibold tracking-wider">
              KLARNA
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-semibold tracking-wider">
              SWISH
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-semibold tracking-wider">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 border border-white/10 font-semibold tracking-wider">
              MASTERCARD
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-xs sm:text-body-sm text-white/60">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Golvfabriken. Alla rättigheter förbehållna.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <a
              href="#"
              className="py-1 hover:text-golvfabriken-wood transition-colors"
            >
              Integritetspolicy
            </a>
            <a
              href="#"
              className="py-1 hover:text-golvfabriken-wood transition-colors"
            >
              Köpvillkor
            </a>
            <a
              href="#"
              className="py-1 hover:text-golvfabriken-wood transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

