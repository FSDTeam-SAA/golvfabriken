import { CartDropdown } from "@/components/cart";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCategories } from "@/lib/hooks/use-categories";
import { getCountryCodeFromPath } from "@/lib/utils/region";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Link, useLocation } from "@tanstack/react-router";
import { MagnifyingGlass, User, XMark } from "@medusajs/icons";
import { useState } from "react";

// Checkmark icon component for USP features
function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ChevronDown icon for dropdowns
function ChevronDownIcon() {
  return (
    <svg
      className="w-4 h-4 ml-1 inline-block"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GolvfabrikenNavbar() {
  const location = useLocation();
  const countryCode = getCountryCodeFromPath(location.pathname) || "se";
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: topLevelCategories } = useCategories({
    fields: "id,name,handle,parent_category_id",
    queryParams: { parent_category_id: "null" },
  });

  const categoryLinks =
    topLevelCategories?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      handle: cat.handle,
    })) ?? [];

  // USP features for top bar (matches reference image)
  const uspFeatures = [
    { text: "Över 10 års erfarenhet" },
    { text: "Prisgaranti" },
    { text: "Snabba leveranser i Sverige" },
    { text: "För privatpersoner och företag" },
  ];

  return (
    <div className="sticky top-0 inset-x-0 z-40">
      {/* Top bar - USP Features */}
      <div className="bg-golvfabriken-graphite text-white">
        <div className="content-container py-2.5">
          <div className="flex items-center justify-center">
            {/* Desktop: Show all 4 USPs evenly distributed */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-8 w-full max-w-6xl">
              {uspFeatures.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-2 text-sm"
                >
                  <CheckIcon />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            {/* Tablet: Show first 3 USPs */}
            <div className="hidden md:grid md:grid-cols-3 lg:hidden gap-6 text-sm">
              {uspFeatures.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-center gap-2">
                  <CheckIcon />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            {/* Mobile: Show first 2 USPs */}
            <div className="md:hidden flex items-center gap-4 text-xs">
              {uspFeatures.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckIcon />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="relative bg-white border-b border-gray-200">
        <nav className="content-container flex items-center justify-between py-4 lg:py-5">
          {/* Logo - BLACK text as per reference image */}
          <Link to="/$countryCode" params={{ countryCode }} className="flex items-center">
            <h1 className="text-xl lg:text-2xl font-bold text-black">
              Golvfabriken
            </h1>
          </Link>

          {/* Desktop Navigation - matches reference image menu items */}
          <NavigationMenu.Root className="hidden lg:flex items-center">
            <NavigationMenu.List className="flex items-center gap-x-6">
              {/* Erbjudanden */}
              <NavigationMenu.Item>
                <Link
                  to="/$countryCode/store"
                  params={{ countryCode }}
                  className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors"
                >
                  Erbjudanden
                </Link>
              </NavigationMenu.Item>

              {/* Parkettgolv with dropdown */}
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors flex items-center group">
                  Parkettgolv
                  <ChevronDownIcon />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-lg rounded-md p-3">
                  {categoryLinks
                    .filter((c) => c.handle === "tragolv")
                    .map((link) => (
                      <NavigationMenu.Link key={link.id} asChild>
                        <Link
                          to="/$countryCode/categories/$handle"
                          params={{ countryCode, handle: link.handle }}
                          className="block px-3 py-2 text-sm text-gray-800 hover:text-golvfabriken-green hover:bg-gray-50 rounded transition-colors"
                        >
                          Visa alla {link.name.toLowerCase()}
                        </Link>
                      </NavigationMenu.Link>
                    ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* Fiskbensgolv with dropdown */}
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors flex items-center">
                  Fiskbensgolv
                  <ChevronDownIcon />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-lg rounded-md p-3">
                  {categoryLinks
                    .filter((c) => c.handle === "laminatgolv")
                    .map((link) => (
                      <NavigationMenu.Link key={link.id} asChild>
                        <Link
                          to="/$countryCode/categories/$handle"
                          params={{ countryCode, handle: link.handle }}
                          className="block px-3 py-2 text-sm text-gray-800 hover:text-golvfabriken-green hover:bg-gray-50 rounded transition-colors"
                        >
                          Visa alla {link.name.toLowerCase()}
                        </Link>
                      </NavigationMenu.Link>
                    ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* Vinylgolv with dropdown */}
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors flex items-center">
                  Vinylgolv
                  <ChevronDownIcon />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-lg rounded-md p-3">
                  {categoryLinks
                    .filter((c) => c.handle === "vinylgolv")
                    .map((link) => (
                      <NavigationMenu.Link key={link.id} asChild>
                        <Link
                          to="/$countryCode/categories/$handle"
                          params={{ countryCode, handle: link.handle }}
                          className="block px-3 py-2 text-sm text-gray-800 hover:text-golvfabriken-green hover:bg-gray-50 rounded transition-colors"
                        >
                          Visa alla {link.name.toLowerCase()}
                        </Link>
                      </NavigationMenu.Link>
                    ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              {/* XXL-golv */}
              <NavigationMenu.Item>
                <Link
                  to="/$countryCode/store"
                  params={{ countryCode }}
                  className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors"
                >
                  XXL-golv
                </Link>
              </NavigationMenu.Item>

              {/* Underlag */}
              <NavigationMenu.Item>
                <Link
                  to="/$countryCode/store"
                  params={{ countryCode }}
                  className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors"
                >
                  Underlag
                </Link>
              </NavigationMenu.Item>

              {/* Tillbehör */}
              <NavigationMenu.Item>
                {categoryLinks.filter((c) => c.handle === "tillbehor").length > 0 ? (
                  categoryLinks
                    .filter((c) => c.handle === "tillbehor")
                    .map((link) => (
                      <Link
                        key={link.id}
                        to="/$countryCode/categories/$handle"
                        params={{ countryCode, handle: link.handle }}
                        className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors"
                      >
                        Tillbehör
                      </Link>
                    ))
                ) : (
                  <Link
                    to="/$countryCode/store"
                    params={{ countryCode }}
                    className="text-sm text-gray-800 hover:text-golvfabriken-green font-normal transition-colors"
                  >
                    Tillbehör
                  </Link>
                )}
              </NavigationMenu.Item>
            </NavigationMenu.List>

            <NavigationMenu.Viewport />
          </NavigationMenu.Root>

          {/* Right side actions - Search, User, Cart icons */}
          <div className="flex items-center gap-4 lg:gap-5">
            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-gray-800 hover:text-golvfabriken-green transition-colors"
              aria-label="Sök"
            >
              <MagnifyingGlass className="w-5 h-5" />
            </button>
            
            {/* User/Account icon */}
            <Link
              to="/$countryCode"
              params={{ countryCode }}
              className="text-gray-800 hover:text-golvfabriken-green transition-colors"
              aria-label="Mitt konto"
            >
              <User className="w-5 h-5" />
            </Link>
            
            {/* Cart */}
            <CartDropdown />

            {/* Mobile hamburger menu */}
            <Drawer>
              <DrawerTrigger className="lg:hidden text-gray-800 hover:text-golvfabriken-green">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="flex items-center justify-between">
                  <DrawerTitle className="text-black text-xl font-bold">
                    Meny
                  </DrawerTitle>
                  <DrawerClose>
                    <XMark className="w-6 h-6" />
                  </DrawerClose>
                </DrawerHeader>
                <div className="px-6 pb-8 space-y-4">
                  <div className="space-y-2">
                    <DrawerClose asChild>
                      <Link
                        to="/$countryCode/store"
                        params={{ countryCode }}
                        className="block text-gray-800 hover:text-golvfabriken-green font-medium py-2 transition-colors"
                      >
                        Erbjudanden
                      </Link>
                    </DrawerClose>
                    {categoryLinks.map((link) => (
                      <DrawerClose key={link.id} asChild>
                        <Link
                          to="/$countryCode/categories/$handle"
                          params={{ countryCode, handle: link.handle }}
                          className="block text-gray-800 hover:text-golvfabriken-green font-medium py-2 transition-colors"
                        >
                          {link.name}
                        </Link>
                      </DrawerClose>
                    ))}
                    <DrawerClose asChild>
                      <Link
                        to="/$countryCode/store"
                        params={{ countryCode }}
                        className="block text-gray-800 hover:text-golvfabriken-green font-medium py-2 transition-colors"
                      >
                        XXL-golv
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        to="/$countryCode/store"
                        params={{ countryCode }}
                        className="block text-gray-800 hover:text-golvfabriken-green font-medium py-2 transition-colors"
                      >
                        Underlag
                      </Link>
                    </DrawerClose>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </nav>
      </header>

      {/* Search overlay - appears when search icon is clicked */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="content-container py-6">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="search"
                placeholder="Sök efter produkter..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golvfabriken-green focus:border-transparent text-gray-800"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Stäng sök"
              >
                <XMark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
