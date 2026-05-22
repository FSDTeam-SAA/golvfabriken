import ErrorBoundary from "@/components/error-boundary"
import { GolvfabrikenFooter } from "@/components/golvfabriken/footer"
import { GolvfabrikenNavbar } from "@/components/golvfabriken/navbar"
import { CartProvider } from "@/lib/context/cart"
import { ToastProvider } from "@/lib/context/toast-context"
import { Outlet } from "@tanstack/react-router"

const Layout = () => {
  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <GolvfabrikenNavbar />

          <main className="relative flex-1">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

          <GolvfabrikenFooter />
        </div>
      </CartProvider>
    </ToastProvider>
  )
}

export default Layout
