import { useState } from "react";

const phases = [
  {
    id: "P0",
    label: "Phase 0",
    title: "Environment & Foundation",
    color: "#0f4c35",
    accent: "#22c55e",
    duration: "~3–4 days",
    description: "Nothing works until this is right. Treat it as the concrete slab — rushed here = cracks everywhere.",
    steps: [
      {
        id: "P0-1",
        title: "Local Dev Environment Setup",
        est: "4h",
        frd: "Section 1, 19.3",
        microsteps: [
          "Install Node.js 20 LTS, pnpm, Docker Desktop — verify all versions",
          "Create project root folder: /golvfabriken — initialise git repo with .gitignore for node_modules, .env, dist",
          "Write docker-compose.yml: postgres:16 (port 5432), redis:7 (port 6379) — named volumes so data survives restarts",
          "Create .env.example with all expected keys (empty values) — commit this; .env itself goes in .gitignore",
          "Run docker compose up -d — confirm both containers healthy via docker ps",
          "Install pgAdmin or TablePlus locally — connect to Postgres container, confirm connection works",
          "Add a Makefile or package.json root script: start:infra, stop:infra — so any dev can spin up with one command",
          "Write a brief README.md: prerequisites, setup steps, .env instructions — do this NOW before you forget",
        ],
      },
      {
        id: "P0-2",
        title: "MedusaJS v2 Project Scaffold",
        est: "3h",
        frd: "Section 1",
        microsteps: [
          "Run: npx create-medusa-app@latest golvfabriken-backend — choose 'no demo data'",
          "Move into /golvfabriken-backend — verify folder structure: /src/modules, /src/api, medusa-config.ts",
          "Update medusa-config.ts: point DATABASE_URL to the Docker postgres container",
          "Update medusa-config.ts: point REDIS_URL to the Docker redis container",
          "Run: npx medusa db:migrate — confirm migrations complete without errors in terminal",
          "Run: npx medusa develop — open http://localhost:9000/health — should return {status: 'ok'}",
          "Run: npx medusa user --email admin@golvfabriken.se --password Admin1234! — create first admin",
          "Open http://localhost:9000/app — log in with new admin, confirm dashboard loads",
          "Commit: 'chore: medusa v2 base scaffold + local db/redis connected'",
        ],
      },
      {
        id: "P0-3",
        title: "Strapi v4 Setup",
        est: "3h",
        frd: "Section 1, 4.1",
        microsteps: [
          "In /golvfabriken-cms run: npx create-strapi-app@latest . --quickstart (SQLite first, switch to Postgres next step)",
          "Stop Strapi, update /config/database.ts to point to the same Docker Postgres (separate DB: golvfabriken_cms)",
          "Create the golvfabriken_cms DB in Postgres via pgAdmin/TablePlus",
          "Run Strapi: npm run develop — confirm admin panel at http://localhost:1337/admin",
          "Register first Strapi admin user",
          "Install Strapi SEO plugin: npm install @strapi/plugin-seo — enable in plugins.ts",
          "Create a bare 'Product Enrichment' content-type in Strapi with fields: slug (UID), long_description (rich text), media_gallery (media, multiple)",
          "Generate an API token in Strapi (Settings → API Tokens) with full-access — paste into /golvfabriken-backend .env as STRAPI_API_TOKEN",
          "Commit: 'chore: strapi v4 + postgres + seo plugin base setup'",
        ],
      },
      {
        id: "P0-4",
        title: "Next.js 14 Frontend Scaffold",
        est: "2h",
        frd: "Section 1",
        microsteps: [
          "Run: npx create-next-app@latest golvfabriken-storefront --app --ts --tailwind --eslint",
          "Install Medusa JS client: npm install @medusajs/js-sdk",
          "Create /lib/medusa.ts — initialise MedusaClient pointing to http://localhost:9000",
          "Create /lib/strapi.ts — thin fetch wrapper pointing to http://localhost:1337 with auth header",
          "Create a simple /app/page.tsx that fetches and renders product count from Medusa — confirms the client works",
          "Confirm npm run dev starts without errors at http://localhost:3000",
          "Set up absolute imports in tsconfig: @/components, @/lib, @/types",
          "Commit: 'chore: next.js 14 app router scaffold + medusa client wired'",
        ],
      },
    ],
  },
  {
    id: "P1",
    label: "Phase 1",
    title: "Authentication & Security",
    color: "#1e3a5f",
    accent: "#60a5fa",
    duration: "~3 days",
    description: "Module 2 of the FRD. Build this before any customer-facing page — everything behind auth.",
    steps: [
      {
        id: "P1-1",
        title: "Medusa Auth Module Configuration",
        est: "3h",
        frd: "Section 2.1–2.2",
        microsteps: [
          "Confirm Medusa v2 built-in auth module is active in medusa-config.ts (it ships enabled by default)",
          "Configure JWT settings in medusa-config.ts: access token 15 min expiry, RS256 algorithm",
          "Generate RS256 key pair locally: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem",
          "Store private key in .env as JWT_SECRET (PEM string, newlines as \\n) — add to .env.example as placeholder",
          "Configure refresh token: HTTP-only cookie, 30-day rolling, sameSite: strict",
          "Write a test: POST /auth/token with valid credentials → assert access_token returned and refresh cookie set",
          "Write a test: POST /auth/token with wrong password 6× → assert 429 or lockout response on 6th",
          "Commit: 'feat(auth): jwt rs256, refresh cookie, lockout config'",
        ],
      },
      {
        id: "P1-2",
        title: "B2C Registration & Login Pages",
        est: "4h",
        frd: "Section 2.1, 3.1",
        microsteps: [
          "Create /app/(auth)/register/page.tsx — form: first name, last name, email, password, marketing consent checkbox",
          "Add client-side validation: password must be 8+ chars, 1 uppercase, 1 number, 1 special char (mirror FRD spec)",
          "On submit: call Medusa POST /customers — handle 409 (email exists) with inline error",
          "Create /app/(auth)/login/page.tsx — email + password form",
          "On login success: store access token in memory (not localStorage — use React context), redirect to /account",
          "Build useAuth() React context/hook: provides customer object, login(), logout(), isLoading",
          "Add 'Forgot password?' link — wire to POST /auth/password-token Medusa endpoint",
          "Create /app/(auth)/reset-password/page.tsx — token from URL query param, new password form",
          "Test full flow manually: register → login → reset password → login again",
          "Commit: 'feat(auth): b2c register/login/reset pages'",
        ],
      },
      {
        id: "P1-3",
        title: "Social OAuth (Google/Facebook)",
        est: "3h",
        frd: "Section 2.1",
        microsteps: [
          "Create Google OAuth app in Google Cloud Console — get CLIENT_ID and CLIENT_SECRET",
          "Add to .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET",
          "Configure Medusa auth provider for Google OAuth in medusa-config.ts",
          "Add 'Continue with Google' button to login page — uses Medusa's OAuth redirect flow",
          "Handle OAuth callback: Medusa creates/finds customer, returns token — same useAuth flow",
          "Test: click Google login → Google consent screen → redirected back → logged in as customer",
          "Make social login optional via store config flag (ENABLE_SOCIAL_LOGIN=true in .env)",
          "Commit: 'feat(auth): google + facebook oauth for b2c'",
        ],
      },
      {
        id: "P1-4",
        title: "Admin 2FA Setup",
        est: "4h",
        frd: "Section 2.1",
        microsteps: [
          "Install: npm install otplib qrcode in Medusa backend",
          "Create custom Medusa API route: POST /admin/auth/2fa/setup — generates TOTP secret, returns QR code as base64",
          "Create route: POST /admin/auth/2fa/verify — validates TOTP token against stored secret",
          "Store 2FA secret encrypted in admin user metadata (AES-256 via Node crypto)",
          "Create route: POST /admin/auth/2fa/disable — requires current TOTP code to disable",
          "Make 2FA mandatory for Super Admin role: if !2fa_enabled, redirect to /admin/setup-2fa on every login",
          "Test with Google Authenticator: scan QR, enter 6-digit code, confirm login works",
          "Commit: 'feat(auth): totp 2fa mandatory for super admin'",
        ],
      },
    ],
  },
  {
    id: "P2",
    label: "Phase 2",
    title: "Product & Catalog",
    color: "#3b1f5e",
    accent: "#a78bfa",
    duration: "~5 days",
    description: "Module 4 of the FRD. The Medusa-Strapi bridge is the hardest part — get the data model right first.",
    steps: [
      {
        id: "P2-1",
        title: "Medusa Product Schema Extensions",
        est: "4h",
        frd: "Section 4.1–4.5",
        microsteps: [
          "List every custom field from FRD 4.1–4.5 not in Medusa core: is_area_product, m2_per_paket, waste_pct, dangerous_goods_lq, shipping_class, hs_code, country_of_origin",
          "Create a Medusa custom module /src/modules/product-extension/ with a ProductExtension entity",
          "Add fields: product_id (FK), is_area_product (bool), m2_per_paket (decimal), waste_pct (decimal), dangerous_goods_lq (bool), shipping_class (enum: Parcel/Pallet/Oversized), hs_code (varchar), country_of_origin (varchar ISO)",
          "Write the migration file — run npx medusa db:migrate — confirm new table in Postgres",
          "Create ProductExtensionService: getByProductId(), upsert() methods",
          "Expose via admin API route: GET/PATCH /admin/products/:id/extension",
          "Test in Postman: create a product via Medusa admin, then PATCH its extension fields",
          "Commit: 'feat(products): custom extension schema (area calc, shipping, customs)'",
        ],
      },
      {
        id: "P2-2",
        title: "Strapi Product Enrichment Content Type",
        est: "3h",
        frd: "Section 4.1, 4.8",
        microsteps: [
          "In Strapi admin: Content-Type Builder → create 'Product Enrichment' collection type",
          "Add fields: medusa_product_id (text, unique), long_description (rich text), media_gallery (media, multiple), meta_title (text, max 60), meta_description (text, max 160), og_image (media), focus_keyphrase (text), robot_settings (enum: index/noindex/nofollow)",
          "Add 'Category' collection type: name, parent_category (self-relation), slug, description, image (media), display_type (enum)",
          "Add 'Tag' collection type: name, slug, meta_description",
          "Enable draft/publish on Product Enrichment (for Scheduled publish from FRD 4.1)",
          "Make all content-types publicly readable via Strapi permissions (Settings → Roles → Public → find-findOne enable)",
          "Test: create one Product Enrichment entry via Strapi, fetch via curl http://localhost:1337/api/product-enrichments?filters[medusa_product_id]=prod_123",
          "Commit: 'feat(cms): strapi product enrichment + category + tag content types'",
        ],
      },
      {
        id: "P2-3",
        title: "Area Calculator Logic",
        est: "3h",
        frd: "Section 4.9",
        microsteps: [
          "Create /components/AreaCalculator.tsx — inputs: required_m2 (number field), waste_pct (read from product metadata, shown as info text)",
          "Implement formula: adjusted_m2 = required_m2 × (1 + waste_pct/100); packs = Math.ceil(adjusted_m2 / m2_per_paket)",
          "Display live feedback: 'You need X packs, covering Y m², including Z% waste allowance'",
          "Wire output quantity directly to Medusa add-to-cart quantity field — no manual entry needed",
          "Add edge case handling: if m2_per_paket is null/0, hide calculator and show standard quantity input",
          "Only render calculator if product metadata is_area_product === true",
          "Write unit tests for the formula: test CEIL rounding, test waste_pct=0, test large numbers",
          "Commit: 'feat(pdp): area calculator component wired to cart quantity'",
        ],
      },
      {
        id: "P2-4",
        title: "Product Detail Page (PDP)",
        est: "5h",
        frd: "Section 4, 6",
        microsteps: [
          "Create /app/products/[handle]/page.tsx — fetch product from Medusa by handle, enrichment from Strapi by medusa_product_id",
          "Render: media gallery with variant image swap, short description, price (with sale price if active), variant selector (color/size dropdowns)",
          "Render: area calculator if is_area_product, else standard quantity input",
          "Render: extended specs table (material, dimensions, HS code, country of origin from extension schema)",
          "Render: up-sell products section ('You might also like') — from Medusa product.metadata.upsells",
          "Add Schema.org Product + Offer + BreadcrumbList JSON-LD in <head>",
          "Wire meta title/description from Strapi enrichment (fallback to Medusa product title)",
          "Make the page ISR: revalidate every 60 seconds (products change occasionally but not constantly)",
          "Commit: 'feat(storefront): pdp with variants, area calc, schema.org, isr'",
        ],
      },
    ],
  },
  {
    id: "P3",
    label: "Phase 3",
    title: "Customer Management (B2C)",
    color: "#1f3d2e",
    accent: "#34d399",
    duration: "~3 days",
    description: "Module 3 of the FRD. Build the account portal — everything a B2C shopper needs post-login.",
    steps: [
      {
        id: "P3-1",
        title: "Customer Profile & Address Book",
        est: "4h",
        frd: "Section 3.1–3.2",
        microsteps: [
          "Create /app/account/profile/page.tsx — form pre-filled from Medusa GET /customers/me",
          "Fields: first name, last name, email (read-only — change email requires re-verify), phone, date of birth, preferred language, marketing consent toggle",
          "On save: PATCH /customers/me — show success toast",
          "Create /app/account/addresses/page.tsx — list all saved addresses",
          "Add address form modal: full name, address lines 1+2, postal code, city, country, phone",
          "On save: POST /customers/me/addresses — handle Fraktjakt address validation (wire in Phase 6)",
          "Add 'Set as default shipping' / 'Set as default billing' actions per address",
          "Test: add 3 addresses, set one as default, confirm it pre-fills in checkout",
          "Commit: 'feat(account): profile edit + address book'",
        ],
      },
      {
        id: "P3-2",
        title: "Wishlist",
        est: "3h",
        frd: "Section 3.3",
        microsteps: [
          "Create Medusa custom module /src/modules/wishlist/ — Wishlist entity: customer_id, name; WishlistItem entity: wishlist_id, variant_id",
          "API routes: POST /store/wishlists (create), GET /store/wishlists (list mine), POST /store/wishlists/:id/items, DELETE /store/wishlists/:id/items/:item_id",
          "Frontend: heart icon button on every product card and PDP — toggles add/remove from default wishlist",
          "Create /app/account/wishlist/page.tsx — render wishlist items with current price + stock status",
          "Add 'Move to Cart' button per item — calls POST /store/carts/:id/line-items then removes from wishlist",
          "Add 'Move entire wishlist to cart' button at top",
          "Add shareable wishlist link: GET /store/wishlists/:id/share — returns public URL (if share=true on wishlist)",
          "Commit: 'feat(wishlist): custom module, ui heart toggle, move to cart'",
        ],
      },
      {
        id: "P3-3",
        title: "Order History & Re-order",
        est: "3h",
        frd: "Section 3.4",
        microsteps: [
          "Create /app/account/orders/page.tsx — paginated list: order ID, date, total, payment status, fulfillment status",
          "Create /app/account/orders/[id]/page.tsx — full order detail: line items, shipping address, payment method",
          "Add 'Re-order' button on order detail: iterates line items, calls POST /store/carts/:id/line-items for each variant",
          "Add 'Download Invoice PDF' button — fetches from /store/orders/:id/invoice (build invoice generation in Phase 7)",
          "Add 'Track Shipment' button — links to /track/{trackingNumber} (public tracking page, Phase 6)",
          "Add 'Request Return' button — opens return request flow (Phase 6 returns module)",
          "Add 'Cancel Order' button — only visible if status is Pending or Processing; calls DELETE /store/orders/:id",
          "Commit: 'feat(account): order history + reorder + cancel'",
        ],
      },
    ],
  },
  {
    id: "P4",
    label: "Phase 4",
    title: "B2B Company Module",
    color: "#3d1f1f",
    accent: "#f87171",
    duration: "~5 days",
    description: "Module 5 of the FRD. Most complex module — do it in strict order, skip nothing.",
    steps: [
      {
        id: "P4-1",
        title: "Company Entity & Application Flow",
        est: "5h",
        frd: "Section 5.1",
        microsteps: [
          "Create /src/modules/b2b-company/ — Company entity: company_name, legal_name, org_number, vat_id, industry, website, account_status (enum), assigned_sales_manager_id",
          "Create CompanyUser entity: company_id, customer_id, role (enum: Admin/Buyer/Approver)",
          "Write migration — run npx medusa db:migrate",
          "Create CompanyService: create(), approve(), suspend(), close(), listEmployees(), assignSalesManager()",
          "Store-facing route: POST /store/companies — B2B application form submission; sets status=Pending",
          "Admin route: PATCH /admin/companies/:id/status — changes Pending→Active, Active→Suspended, etc.",
          "Trigger email notification to sales team on new Pending application (wire email in Phase 7)",
          "Create /app/b2b/apply/page.tsx — public B2B application form (company name, legal name, org number, VAT ID, website)",
          "Commit: 'feat(b2b): company entity, application flow, admin approval route'",
        ],
      },
      {
        id: "P4-2",
        title: "B2B Financials & Price Lists",
        est: "4h",
        frd: "Section 5.2",
        microsteps: [
          "Add to Company entity: credit_limit (decimal), current_credit_used (decimal — computed), net_payment_terms (enum: Net30/Net60/Net90), tax_exempt (bool), default_price_list_id (FK to Medusa PriceList), spend_approval_threshold (decimal)",
          "Create a seed script that creates 3 default Medusa PriceLists: 'Retail', 'B2B Wholesale -10%', 'VIP -15%'",
          "In CompanyService.getOrderTotal(): if company.tax_exempt, zero-rate VAT on cart",
          "Admin UI: on Company detail page, show credit limit, current used, payment terms — allow edit",
          "Ensure credit_limit is NEVER exposed in any store-facing API response (add middleware check)",
          "Test: assign a B2B price list to company → log in as B2B buyer → confirm prices match price list",
          "Commit: 'feat(b2b): financials, credit limit, price lists, tax exempt'",
        ],
      },
      {
        id: "P4-3",
        title: "Order Approval Workflow",
        est: "6h",
        frd: "Section 5.4",
        microsteps: [
          "Add order_approval_status field to Medusa order metadata: null | PendingApproval | Approved | Rejected",
          "In checkout submit handler (Medusa API): check if customer is B2B buyer AND cart.total > company.spend_approval_threshold",
          "If threshold exceeded: save cart as order with status=PendingApproval — do NOT proceed to payment — return 202 with {requires_approval: true}",
          "Create Approval entity: order_id, approver_id, status, note, decided_at",
          "Route: GET /store/companies/:id/pending-approvals — for Approver role only",
          "Route: PATCH /store/orders/:id/approval — body: {action: 'approve'|'reject', note: string} — Approver only",
          "On approve: trigger Medusa payment flow — order proceeds normally",
          "On reject: set order status=Cancelled, restore cart — send email to buyer with reason",
          "Frontend: /app/b2b/approvals/page.tsx — Approver dashboard lists pending orders, approve/reject with note",
          "Commit: 'feat(b2b): order approval workflow with state machine'",
        ],
      },
      {
        id: "P4-4",
        title: "B2B Quote / RFQ System",
        est: "5h",
        frd: "Section 5.5",
        microsteps: [
          "Create Quote entity: company_id, buyer_id, sales_manager_id, status (enum: Draft/Sent/Accepted/Rejected/Expired/ConvertedToOrder), expiry_date, items (JSON), discount, notes",
          "Create QuoteMessage entity: quote_id, sender_id, body, created_at — for threaded negotiation",
          "Route: POST /store/quotes — buyer converts cart to RFQ; sets status=Draft, notifies sales manager",
          "Route: GET /admin/quotes — sales manager sees all quotes, filtered by status",
          "Route: PATCH /admin/quotes/:id — sales manager edits prices, quantities, discount, sets expiry, changes status to Sent",
          "Route: PATCH /store/quotes/:id/accept — buyer accepts quote; status=Accepted",
          "Route: POST /store/quotes/:id/convert — creates a live Medusa order with locked pricing from quote",
          "Generate Quote PDF on status=Sent: company branding, line items, validity date (use pdf-lib or puppeteer)",
          "Commit: 'feat(b2b): rfq system, quote negotiation, convert to order'",
        ],
      },
    ],
  },
  {
    id: "P5",
    label: "Phase 5",
    title: "Cart & Checkout",
    color: "#1f2d3d",
    accent: "#38bdf8",
    duration: "~4 days",
    description: "Module 7 of the FRD. The most user-critical flow — one broken step = lost revenue.",
    steps: [
      {
        id: "P5-1",
        title: "Cart Setup (Persistent + Guest)",
        est: "3h",
        frd: "Section 7.1",
        microsteps: [
          "Guest cart: on first page load, POST /store/carts — store cart_id in a cookie (httpOnly, 30-day expiry)",
          "Logged-in cart: on login, if cookie cart exists → POST /store/carts/:id/complete-customer-info to attach customer; if no cookie cart, fetch existing customer cart",
          "Cart merging on login: if guest cart has items AND customer has existing cart, merge via Medusa's built-in cart merge logic",
          "Stock reservation: confirm Medusa reserves stock when line items added (it does by default) — test by adding item and checking inventory in admin",
          "Cart sidebar component: show line items, quantities, subtotal, cross-sell products section",
          "Abandoned cart: create a Medusa scheduled job that runs every hour, finds carts with email but no order after 1h, emits abandoned_cart event (email in Phase 7)",
          "Test: add items as guest → log in → confirm cart preserved with items",
          "Commit: 'feat(cart): persistent cart, guest merge on login, stock reservation'",
        ],
      },
      {
        id: "P5-2",
        title: "Checkout Flow — Steps 1–3",
        est: "5h",
        frd: "Section 7.2",
        microsteps: [
          "Create /app/checkout/page.tsx — multi-step layout with step indicator (Contact / Shipping / Shipping Method / Payment / Review)",
          "Step 1 Contact: email field (pre-filled if logged in), newsletter checkbox — POST /store/carts/:id with email",
          "Step 2 Shipping Address: address form with saved address selector for logged-in users — PATCH /store/carts/:id/shipping-address",
          "On address submit: call Fraktjakt Address Register API to validate Swedish postal codes (HOLD — stub this with a TODO comment; wire real API in Phase 6)",
          "Step 3 Shipping Method: show skeleton loader while rates fetch — call Medusa shipping options endpoint (which internally calls Fraktjakt — Phase 6); for now show placeholder 'Standard Shipping 99 SEK'",
          "Each step saves to cart before advancing — pressing Back restores previous step's data",
          "Mobile: each step is full-screen on mobile, progress bar at top",
          "Commit: 'feat(checkout): steps 1-3 scaffold, address form, placeholder shipping'",
        ],
      },
      {
        id: "P5-3",
        title: "Checkout Steps 4–6 + B2B Differences",
        est: "4h",
        frd: "Section 7.2–7.3",
        microsteps: [
          "Step 4 Payment: Klarna widget placeholder (wire in Phase 6) + Swish option for Swedish customers",
          "Step 5 Review: full order summary — items, address, shipping, payment, total — terms checkbox (disabled submit until checked)",
          "On Place Order: POST /store/orders — handle success (redirect to /order/confirm/:id) and error (show inline message, do NOT lose cart)",
          "Step 6 Confirmation: display order ID, estimated delivery, full item list; trigger confirmation email (Phase 7)",
          "B2B checkout: if customer.is_b2b → replace address form with company depot dropdown; add PO number field; add invoice reference field",
          "B2B checkout: on submit check approval threshold (P4-3 logic) — if needs approval, show 'Submitted for Approval' page instead of payment",
          "Test full B2C flow: guest checkout from add-to-cart to order confirmation",
          "Test B2B approval gate: set low threshold, place order as buyer, confirm Approver sees it",
          "Commit: 'feat(checkout): full b2c + b2b checkout flows, approval gate'",
        ],
      },
    ],
  },
  {
    id: "P6",
    label: "Phase 6",
    title: "Fraktjakt & Klarna Integrations",
    color: "#2d1f3d",
    accent: "#c084fc",
    duration: "~5 days",
    description: "Modules 10 & 11 of the FRD. These are external APIs — test against sandboxes first, never prod.",
    steps: [
      {
        id: "P6-1",
        title: "Fraktjakt Shipping Module",
        est: "5h",
        frd: "Section 10.1–10.2",
        microsteps: [
          "Register Fraktjakt test account at fraktjakt.se — get CONSIGNOR_ID and API_KEY for sandbox",
          "Add to .env: FRAKTJAKT_CONSIGNOR_ID, FRAKTJAKT_API_KEY, FRAKTJAKT_BASE_URL=https://api2.fraktjakt.se",
          "Create /src/modules/fraktjakt/service.ts with method: getRates({ weight, length, width, height, destination_country, destination_postal_code })",
          "Inside getRates: build Fraktjakt Query API XML payload (the API uses XML — use fast-xml-parser to build/parse)",
          "Parse response: extract array of {carrier_name, service_name, price_inc_vat, estimated_days, carrier_logo_url}",
          "Add 3s timeout: if Fraktjakt doesn't respond in 3s, return fallback flat rate [{carrier_name: 'Standard', price_inc_vat: 99, estimated_days: '3-5', is_fallback: true}]",
          "Register FraktjaktModule in medusa-config.ts",
          "Test getRates() with a 5kg parcel to Stockholm postal code 11122 — log the raw response, confirm parsing works",
          "Commit: 'feat(fraktjakt): query api module with 3s fallback'",
        ],
      },
      {
        id: "P6-2",
        title: "Fraktjakt Rates at Checkout",
        est: "4h",
        frd: "Section 10.2",
        microsteps: [
          "Create a Medusa fulfillment provider that wraps FraktjaktModule — implement getFulfillmentOptions() which calls getRates()",
          "Sum weight and dimensions from all cart line items (using product extension fields from P2-1)",
          "Register the fulfillment provider in medusa-config.ts",
          "In checkout Step 3: call GET /store/shipping-options?cart_id=xxx — renders real Fraktjakt rates",
          "Show per option: carrier logo (if available), service name, estimated days, price",
          "If is_fallback=true in response, show notice: 'Shipping costs calculated at dispatch'",
          "Implement free shipping override: if cart.total > FREE_SHIPPING_THRESHOLD env var, inject a Free Shipping option at top of list",
          "Test: change cart weight, confirm rates change; change destination country, confirm international rates appear",
          "Commit: 'feat(checkout): live fraktjakt rates in checkout step 3'",
        ],
      },
      {
        id: "P6-3",
        title: "Fraktjakt Shipment Booking & Labels",
        est: "4h",
        frd: "Section 10.1, 10.4",
        microsteps: [
          "In Medusa order fulfillment hook (post-payment): call Fraktjakt Order API Type 1 with the selected shipping option's query result ID",
          "Store Fraktjakt shipment_id and tracking_number in Medusa fulfillment metadata",
          "Create admin route: GET /admin/orders/:id/shipping-label — fetches label PDF from Fraktjakt and streams to browser",
          "Admin UI: on order detail page, add 'Print Label' button + 'Track Shipment' button",
          "Add bulk label print: order list page checkbox select → 'Print Labels' → downloads multi-page PDF",
          "Implement pallet calculation: if product.shipping_class=Pallet, use Fraktjakt Shipment Type 2 with pallet dimensions",
          "Test: place a test order → fulfil it → confirm shipment booked in Fraktjakt sandbox → download label PDF",
          "Commit: 'feat(fraktjakt): shipment booking post-payment, label download'",
        ],
      },
      {
        id: "P6-4",
        title: "Tracking Webhooks & Public Tracking Page",
        est: "3h",
        frd: "Section 10.5",
        microsteps: [
          "Create Medusa webhook endpoint: POST /webhooks/fraktjakt — receives tracking status push events",
          "Verify incoming Fraktjakt webhook signature (HMAC-SHA256 if supported, else IP whitelist)",
          "On tracking event: update Medusa order fulfillment status; emit internal order.tracking_updated event",
          "Create /app/track/[trackingNumber]/page.tsx — public page, no login required",
          "Fetch tracking data from Medusa: GET /store/shipments/:tracking_number/status",
          "Render: status timeline (Accepted → In Transit → Out for Delivery → Delivered) with timestamps",
          "Set up polling fallback: Medusa cron job every 2h pulls status for orders in active transit states",
          "Commit: 'feat(tracking): webhook handler, public tracking page, polling fallback'",
        ],
      },
      {
        id: "P6-5",
        title: "Klarna Payment Integration",
        est: "5h",
        frd: "Section 11.1–11.3",
        microsteps: [
          "Sign up for Klarna developer account — get playground API_USERNAME and API_PASSWORD",
          "Add to .env: KLARNA_API_USERNAME, KLARNA_API_PASSWORD, KLARNA_BASE_URL=https://api.playground.klarna.com",
          "Install Medusa Klarna plugin or build custom payment provider (check Medusa v2 plugin registry first)",
          "Configure: region=SE, auto_capture=false (capture on fulfillment), send_order_lines=true",
          "In checkout Step 4: render Klarna widget using Klarna.js (loaded from Klarna's CDN — never our server)",
          "On payment authorised: Medusa captures the Klarna authorization token, creates the order",
          "On fulfillment: trigger Klarna capture API call (capture funds)",
          "Add Swish payment option: show only if customer phone is Swedish (+46) — use Swish sandbox API",
          "Test: complete full checkout with Klarna 'Pay Later' test credentials → confirm order created → capture on admin fulfil",
          "Commit: 'feat(klarna): payment provider, widget, capture on fulfil, swish option'",
        ],
      },
    ],
  },
  {
    id: "P7",
    label: "Phase 7",
    title: "Orders, Fulfillment & Emails",
    color: "#1f3030",
    accent: "#2dd4bf",
    duration: "~4 days",
    description: "Modules 9 & 12 of the FRD. Tie together everything before — order lifecycle + all triggered emails.",
    steps: [
      {
        id: "P7-1",
        title: "Order Lifecycle & Admin Order Detail",
        est: "4h",
        frd: "Section 9.1–9.2",
        microsteps: [
          "Map all order statuses from FRD 9.1 to Medusa's status system — add custom statuses to order metadata where Medusa doesn't have them natively (On Hold, Pending Approval)",
          "Create admin order detail page extensions: add Timeline section showing all status changes with actor + timestamp (pull from Medusa audit logs)",
          "Add 'Internal Note' and 'Customer-Visible Note' fields on order detail — PATCH /admin/orders/:id with notes",
          "Add 'Resend Confirmation Email' button on order detail",
          "Add 'Place on Hold' / 'Release Hold' actions — manually change status + log reason",
          "Test full order lifecycle: Pending → Processing → Fulfilled → Completed",
          "Commit: 'feat(orders): full lifecycle mapping, admin detail enhancements, timeline'",
        ],
      },
      {
        id: "P7-2",
        title: "Returns & Refunds",
        est: "5h",
        frd: "Section 9.3",
        microsteps: [
          "Customer flow: /app/account/orders/[id]/return — select items, qty, reason dropdown, optional photo upload",
          "POST /store/orders/:id/return-requests — creates ReturnRequest entity with RMA number (auto: RMA-{YYYYMM}-{SEQ})",
          "Admin: GET /admin/return-requests — list all pending returns with product photos if uploaded",
          "Admin actions: Approve (full or partial items), Reject with note",
          "On Approve: call Fraktjakt Return Shipment API → get return label → email to customer",
          "On Approve + restock: update Medusa inventory quantity +N for the returned variant",
          "Refund: call Klarna Refund API for original payment method; or issue Store Credit if customer chooses",
          "14-day return window enforcement: if order.delivered_at + 14 days < now → disable return request button with message",
          "Commit: 'feat(returns): rma flow, fraktjakt return label, klarna refund, restock'",
        ],
      },
      {
        id: "P7-3",
        title: "Invoice Generation",
        est: "4h",
        frd: "Section 12.1–12.2",
        microsteps: [
          "Choose PDF library: pdf-lib (lightweight, no puppeteer needed) — install in Medusa backend",
          "Build InvoiceService.generate(orderId): fetches order, customer/company, line items, tax breakdown",
          "Invoice layout: company logo (from settings), business address, VAT ID, order table, subtotal, tax lines, total, payment terms, footer text",
          "Dynamic tags populated: {order_id}, {order_date}, {customer_name}, {due_date}, {payment_terms}, {po_number}",
          "Store generated PDF in S3/R2 with path: invoices/{order_id}.pdf",
          "Create route: GET /store/orders/:id/invoice → returns signed S3 URL (valid 1h)",
          "B2B: if company.tax_exempt → zero VAT on invoice + add 'Reverse Charge' line",
          "B2B: Pro-forma invoice option (generate before payment) — admin manually triggers via order detail",
          "Test: create order, generate invoice, open PDF, verify all fields correct",
          "Commit: 'feat(invoices): pdf generation, s3 storage, tax-exempt handling'",
        ],
      },
      {
        id: "P7-4",
        title: "Email Notification System",
        est: "4h",
        frd: "Section 12.3–12.4",
        microsteps: [
          "Configure SendGrid (or Postmark) SMTP in .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL",
          "Create /src/modules/notifications/email.service.ts — wrapper around nodemailer with SendGrid transport",
          "Create email templates in Strapi: order_placed, order_fulfilled, b2b_pending_approval, b2b_approved, b2b_rejected, quote_sent, return_approved, abandoned_cart, password_reset (HTML/MJML)",
          "Add locale support: fetch template for customer.preferred_language (sv / en) — fallback to sv",
          "Subscribe to Medusa events: order.placed → send order_placed email with invoice PDF attachment",
          "order.fulfillment_created → send order_fulfilled email with tracking link and invoice PDF",
          "order.return_request_approved → send return_approved email with return label PDF attachment",
          "Abandoned cart job (from P5-1) → send sequence: 1h reminder, 24h reminder+incentive, 72h final",
          "BCC rules: every invoice email BCCs accounting@golvfabriken.se (from settings)",
          "Test each trigger manually using Medusa event emit + check SendGrid activity log",
          "Commit: 'feat(emails): all notification triggers, multilingual templates, bcc rules'",
        ],
      },
    ],
  },
  {
    id: "P8",
    label: "Phase 8",
    title: "Search, Promotions & Growth",
    color: "#2d2510",
    accent: "#fbbf24",
    duration: "~4 days",
    description: "Modules 6, 8, 13 of the FRD. These make the store convert — search and promotions are revenue-critical.",
    steps: [
      {
        id: "P8-1",
        title: "Full-Text Search with MeiliSearch",
        est: "4h",
        frd: "Section 6",
        microsteps: [
          "Add meilisearch service to docker-compose.yml (port 7700) — run docker compose up -d",
          "Install: npm install meilisearch @medusajs/plugin-search-meilisearch in Medusa",
          "Configure Medusa MeiliSearch plugin: index products, searchable fields: title, description, sku, tags, brand",
          "Run npx medusa index:sync — confirm products appear in MeiliSearch dashboard (http://localhost:7700)",
          "Frontend SearchBar component: input with 2-char minimum trigger, debounce 300ms, calls GET /store/products/search?q=xxx",
          "Autocomplete dropdown: shows product name + category matches, max 8 results, keyboard-navigable",
          "Search results page /app/search?q=xxx: faceted filters (category, brand, price range slider, color, availability)",
          "Configure typo tolerance in MeiliSearch: typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4 } }",
          "B2B filter: if customer is B2B buyer, add filter to search query: visibility=b2b OR visibility=public",
          "Commit: 'feat(search): meilisearch, autocomplete, facets, typo tolerance, b2b filter'",
        ],
      },
      {
        id: "P8-2",
        title: "Promotions & Coupon Engine",
        est: "4h",
        frd: "Section 8.1–8.2",
        microsteps: [
          "Use Medusa v2 native Promotions module — it ships with coupon and automatic promotion support",
          "Create test promotions via admin: percentage discount, fixed amount, free shipping, buy-X-get-Y",
          "Test min/max spend restrictions, individual-use-only flag, exclude sale items flag",
          "Add coupon code field to cart sidebar and checkout — on submit call POST /store/carts/:id/promotions",
          "Handle errors: invalid code (404), expired (400), already used (409) — show friendly messages",
          "Flash sale: create a scheduled Medusa job that activates/deactivates promotions at start/end datetime",
          "B2B restriction: add company_ids array to promotion metadata — validate in cart service before applying",
          "Test tiered discount: add items to 5000 SEK threshold, confirm 10% applied automatically",
          "Commit: 'feat(promotions): coupon codes, auto promos, flash sales, b2b restrictions'",
        ],
      },
      {
        id: "P8-3",
        title: "Gift Cards",
        est: "3h",
        frd: "Section 8.4",
        microsteps: [
          "Use Medusa v2 native Gift Card module — confirm it's enabled in medusa-config.ts",
          "Admin: create gift cards with value, expiry, quantity — auto-generate unique codes",
          "Sell gift cards as virtual products in the storefront (no shipping required)",
          "On gift card order completion: trigger email to purchaser with the code",
          "Checkout: gift card code field — validate via GET /store/gift-cards/:code, show balance",
          "Allow partial redemption: if gift card balance < order total, apply balance and charge remainder to Klarna",
          "Store remaining balance on gift card after partial use",
          "Add /app/gift-cards/check-balance page — public, enter code, see balance",
          "Commit: 'feat(gift-cards): create, sell, partial redemption, balance check page'",
        ],
      },
      {
        id: "P8-4",
        title: "Reviews & Ratings",
        est: "3h",
        frd: "Section 13",
        microsteps: [
          "Create Review entity: product_id, customer_id, order_id (FK — verified purchase), rating (1-5), title (80 chars), body (1000 chars), photos (JSON array of S3 URLs), status (enum: Pending/Published/Rejected)",
          "Route: POST /store/reviews — only allowed if customer has order containing the product AND within review window",
          "Admin route: PATCH /admin/reviews/:id — approve/reject/add-reply",
          "Auto-approve option: store setting REVIEW_AUTO_APPROVE=true — skips manual moderation but runs profanity filter (bad-words npm package)",
          "Review request email: 7 days after order status=Completed → send email with review link (configurable delay)",
          "PDP: fetch aggregate rating (avg, count) from GET /store/products/:id/reviews/summary",
          "Render AggregateRating schema.org JSON-LD on PDP",
          "Commit: 'feat(reviews): verified purchase reviews, moderation, aggregate rating, schema'",
        ],
      },
    ],
  },
  {
    id: "P9",
    label: "Phase 9",
    title: "Analytics, GDPR & Settings",
    color: "#1a1a2e",
    accent: "#818cf8",
    duration: "~3 days",
    description: "Modules 14, 15, 17, 18 of the FRD. Compliance and observability — required before go-live.",
    steps: [
      {
        id: "P9-1",
        title: "Analytics & GA4",
        est: "3h",
        frd: "Section 14",
        microsteps: [
          "Install GA4 in Next.js: add gtag script to /app/layout.tsx — only load after cookie consent given (check consent context)",
          "Fire ecommerce events: view_item (PDP load), add_to_cart (cart add), begin_checkout (checkout start), purchase (order confirmation)",
          "Meta Pixel: same conditional loading pattern after consent — fire ViewContent, AddToCart, Purchase events",
          "Admin sales dashboard page: fetch from Medusa reporting endpoints — revenue by period, top products, top customers",
          "Add date range picker to dashboard — filter all metrics by selected range",
          "Low stock report page: list products at/below threshold, exportable CSV button",
          "Klarna settlement report: fetch daily from Klarna Reconciliation API, store in DB, downloadable CSV in admin",
          "Commit: 'feat(analytics): ga4 + meta pixel consent-gated, admin dashboard, reports'",
        ],
      },
      {
        id: "P9-2",
        title: "GDPR Compliance",
        est: "4h",
        frd: "Section 15",
        microsteps: [
          "Build cookie consent banner component: 'Accept All' / 'Manage Preferences' / 'Reject Non-Essential' buttons",
          "Store consent decision in a cookie (consent_preferences) with timestamp and policy version",
          "Gate ALL analytics scripts (GA4, Meta Pixel) behind consent check — use React context: const { analyticsAllowed } = useCookieConsent()",
          "Account settings: 'Download My Data' button → calls GET /store/customers/me/export → returns JSON of all personal data",
          "Account settings: 'Delete My Account' button → calls DELETE /store/customers/me → anonymises PII (replace with ANON_{uuid}), retains order records",
          "Ensure marketing consent is a separate opt-in field (not bundled with account creation)",
          "Data retention cron job: runs weekly, finds inactive customers (no login > X years) → flags for anonymisation → admin approval before execution",
          "Test GDPR export: create account, place order, export data — verify all personal fields included",
          "Commit: 'feat(gdpr): consent banner, data export, erasure, retention policy'",
        ],
      },
      {
        id: "P9-3",
        title: "Settings, Tax & Webhooks",
        est: "4h",
        frd: "Sections 17, 16",
        microsteps: [
          "Build admin Settings pages: General (store name, logo, default currency/language, order prefix), Tax (rates table per country), Shipping Zones",
          "Configure Swedish VAT rates in Medusa: Standard 25%, Reduced 12%, Zero 0% — assign to product tax classes",
          "EU VAT OSS: detect if B2C customer is in EU but not Sweden → apply destination country VAT rate",
          "B2B Reverse Charge: if company.vat_id is valid EU VAT ID → zero-rate + add 'Reverse Charge' note on invoice",
          "Webhook system: admin can register up to 10 external endpoints — store in Webhook entity (url, secret, subscribed_events[])",
          "Create WebhookService: on events from FRD 16 table, iterate matching webhooks, POST payload with HMAC-SHA256 signature header",
          "Implement retry with exponential backoff: 5 retries at 1s, 2s, 4s, 8s, 16s intervals",
          "Webhook delivery logs: store last 30 days of attempts with status code and response body",
          "Commit: 'feat(settings): tax config, eu vat oss, b2b reverse charge, webhook system'",
        ],
      },
    ],
  },
  {
    id: "P10",
    label: "Phase 10",
    title: "QA, Performance & Go-Live",
    color: "#1a2e1a",
    accent: "#4ade80",
    duration: "~5 days",
    description: "No new features — only harden what exists. This phase is what separates a live store from a demo.",
    steps: [
      {
        id: "P10-1",
        title: "End-to-End Testing",
        est: "6h",
        frd: "Section 19",
        microsteps: [
          "Install Playwright: npm install -D @playwright/test in storefront",
          "Write E2E test: full B2C purchase flow — search product → add to cart → checkout (address + Klarna sandbox) → confirm order",
          "Write E2E test: B2B approval flow — buyer places over-threshold order → approver approves → payment completes",
          "Write E2E test: return flow — customer requests return → admin approves → invoice updated",
          "Write E2E test: area calculator — enter 20 m², 10% waste, confirm correct pack quantity in cart",
          "Run tests in CI (GitHub Actions): on every PR to main branch → run full Playwright suite against staging",
          "Performance: run Lighthouse on PDP, category page, checkout — target LCP < 2.5s",
          "Fix any Lighthouse issues: lazy-load images below the fold, preload LCP image, move non-critical JS to defer",
          "Commit: 'test: playwright e2e suite for critical flows'",
        ],
      },
      {
        id: "P10-2",
        title: "Security Hardening",
        est: "4h",
        frd: "Section 2.3, 19",
        microsteps: [
          "Run npm audit in all three repos — resolve all critical and high severity issues",
          "Add rate limiting middleware to Medusa: express-rate-limit — login: 10/min, general API: 100/min, configurable per endpoint",
          "Verify CORS config: whitelist only production frontend domain + localhost for dev",
          "Add HSTS header to Next.js: Strict-Transport-Security: max-age=31536000; includeSubDomains",
          "Audit: confirm credit_limit never appears in any store-facing API response (grep codebase for 'credit_limit')",
          "Audit: confirm Fraktjakt and Klarna API calls happen ONLY from Medusa backend — grep frontend code for API keys",
          "Run Snyk scan on all repos — fix or document any findings",
          "Verify all admin actions write to audit log: spot-check 5 actions (approve company, update price, cancel order)",
          "Commit: 'security: rate limiting, hsts, cors, audit log verification, snyk clean'",
        ],
      },
      {
        id: "P10-3",
        title: "Staging Deploy & Go-Live",
        est: "8h",
        frd: "Section 19.2",
        microsteps: [
          "Set up staging environment: Railway or Render for Medusa + Strapi; Vercel for Next.js frontend",
          "Provision managed Postgres (Railway Postgres or Supabase) and Redis (Upstash) for staging",
          "Set up S3-compatible storage (Cloudflare R2) for product images and invoice PDFs",
          "Run all migrations on staging DB: npx medusa db:migrate",
          "Populate staging with real product data from Strapi CMS (content team task, but developer must seed Medusa with matching product IDs)",
          "Configure all env vars in staging: Fraktjakt production credentials, Klarna production credentials, SendGrid, GA4",
          "Run full Playwright E2E suite against staging — must be 100% green before go-live",
          "DNS cutover: point golvfabriken.se to Vercel; verify HTTPS + HSTS working",
          "Monitor for 24h post-launch: watch Medusa logs, Fraktjakt API error rate, Klarna payment success rate, Sentry for JS errors",
          "Commit: 'deploy: staging → production go-live checklist complete'",
        ],
      },
    ],
  },
];

const totalSteps = phases.reduce((acc, p) => acc + p.steps.length, 0);
const totalMicrosteps = phases.reduce(
  (acc, p) => acc + p.steps.reduce((a, s) => a + s.microsteps.length, 0),
  0
);

export default function DevPlan() {
  const [activePhase, setActivePhase] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const [completedMicrosteps, setCompletedMicrosteps] = useState({});
  const [search, setSearch] = useState("");

  const toggleMicrostep = (key) => {
    setCompletedMicrosteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const phase = phases[activePhase];

  const getStepProgress = (phaseIdx, stepIdx) => {
    const step = phases[phaseIdx].steps[stepIdx];
    const done = step.microsteps.filter(
      (_, mIdx) => completedMicrosteps[`${phaseIdx}-${stepIdx}-${mIdx}`]
    ).length;
    return { done, total: step.microsteps.length };
  };

  const getPhaseProgress = (phaseIdx) => {
    const p = phases[phaseIdx];
    let done = 0,
      total = 0;
    p.steps.forEach((step, sIdx) => {
      step.microsteps.forEach((_, mIdx) => {
        total++;
        if (completedMicrosteps[`${phaseIdx}-${sIdx}-${mIdx}`]) done++;
      });
    });
    return { done, total };
  };

  const overallDone = Object.values(completedMicrosteps).filter(Boolean).length;

  const filteredSteps = search.trim()
    ? phase.steps.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.microsteps.some((m) =>
            m.toLowerCase().includes(search.toLowerCase())
          )
      )
    : phase.steps;

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        background: "#0d0d0d",
        minHeight: "100vh",
        color: "#e0e0e0",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)",
          borderBottom: "1px solid #2a2a2a",
          padding: "24px 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "4px",
                color: "#666",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Golvfabriken B2B &amp; B2C — FRD v1.0
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#fff",
                letterSpacing: "-0.5px",
              }}
            >
              Development Execution Plan
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {[
              { label: "Phases", val: phases.length },
              { label: "Modules", val: totalSteps },
              { label: "Microsteps", val: totalMicrosteps },
              {
                label: "Done",
                val: `${overallDone}/${totalMicrosteps}`,
                highlight: true,
              },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: s.highlight ? "#22c55e" : "#fff",
                  }}
                >
                  {s.val}
                </div>
                <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", textTransform: "uppercase" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div
          style={{
            marginTop: "16px",
            height: "3px",
            background: "#1a1a1a",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(overallDone / totalMicrosteps) * 100}%`,
              background: "linear-gradient(90deg, #22c55e, #60a5fa)",
              transition: "width 0.4s ease",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 105px)" }}>
        {/* Phase sidebar */}
        <div
          style={{
            width: "220px",
            flexShrink: 0,
            background: "#111",
            borderRight: "1px solid #1f1f1f",
            padding: "16px 0",
            overflowY: "auto",
          }}
        >
          {phases.map((p, idx) => {
            const prog = getPhaseProgress(idx);
            const pct = Math.round((prog.done / prog.total) * 100);
            const isActive = activePhase === idx;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePhase(idx);
                  setExpandedStep(null);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 20px",
                  background: isActive ? "#1a1a1a" : "transparent",
                  border: "none",
                  borderLeft: isActive
                    ? `3px solid ${p.accent}`
                    : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    color: p.accent,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: isActive ? "#fff" : "#888",
                    fontWeight: isActive ? "600" : "400",
                    lineHeight: 1.3,
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    height: "2px",
                    background: "#1f1f1f",
                    borderRadius: "1px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: p.accent,
                      borderRadius: "1px",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#555",
                    marginTop: "3px",
                  }}
                >
                  {prog.done}/{prog.total} steps · {p.duration}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
          {/* Phase header */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: `1px solid ${phase.color}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  background: phase.color,
                  border: `1px solid ${phase.accent}`,
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "11px",
                  color: phase.accent,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {phase.label}
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#fff",
                    margin: "0 0 6px 0",
                  }}
                >
                  {phase.title}
                </h1>
                <p
                  style={{
                    color: "#888",
                    fontSize: "13px",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {phase.description}
                </p>
              </div>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search steps in this phase..."
              style={{
                marginTop: "16px",
                width: "100%",
                maxWidth: "400px",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                padding: "8px 14px",
                color: "#e0e0e0",
                fontSize: "12px",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredSteps.map((step) => {
              const stepIdx = phase.steps.indexOf(step);
              const { done, total } = getStepProgress(activePhase, stepIdx);
              const pct = Math.round((done / total) * 100);
              const isExpanded = expandedStep === stepIdx;
              const isComplete = done === total;

              return (
                <div
                  key={step.id}
                  style={{
                    background: "#111",
                    border: `1px solid ${isComplete ? phase.accent : "#1f1f1f"}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Step header */}
                  <button
                    onClick={() =>
                      setExpandedStep(isExpanded ? null : stepIdx)
                    }
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {/* Step ID badge */}
                    <div
                      style={{
                        background: isComplete ? phase.accent : phase.color,
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontSize: "10px",
                        color: isComplete ? "#000" : phase.accent,
                        fontWeight: "700",
                        letterSpacing: "1px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {step.id}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: isComplete ? phase.accent : "#e0e0e0",
                          marginBottom: "4px",
                        }}
                      >
                        {step.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontSize: "10px",
                          color: "#555",
                        }}
                      >
                        <span>⏱ {step.est}</span>
                        <span>📄 FRD {step.frd}</span>
                        <span>
                          {done}/{total} microsteps
                        </span>
                      </div>
                    </div>

                    {/* Progress ring area */}
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: pct === 100 ? phase.accent : "#555",
                        }}
                      >
                        {pct}%
                      </div>
                      <div
                        style={{
                          width: "80px",
                          height: "3px",
                          background: "#1f1f1f",
                          borderRadius: "2px",
                          marginTop: "4px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: phase.accent,
                            borderRadius: "2px",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#555",
                        fontSize: "16px",
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        flexShrink: 0,
                      }}
                    >
                      ▾
                    </div>
                  </button>

                  {/* Microsteps */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid #1a1a1a",
                        padding: "4px 0 12px 0",
                      }}
                    >
                      {step.microsteps.map((micro, mIdx) => {
                        const key = `${activePhase}-${stepIdx}-${mIdx}`;
                        const done = completedMicrosteps[key];
                        const highlighted =
                          search &&
                          micro.toLowerCase().includes(search.toLowerCase());

                        return (
                          <div
                            key={mIdx}
                            onClick={() => toggleMicrostep(key)}
                            style={{
                              display: "flex",
                              gap: "14px",
                              alignItems: "flex-start",
                              padding: "10px 20px",
                              cursor: "pointer",
                              background: highlighted
                                ? "rgba(251,191,36,0.05)"
                                : "transparent",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                highlighted
                                  ? "rgba(251,191,36,0.08)"
                                  : "#161616")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = highlighted
                                ? "rgba(251,191,36,0.05)"
                                : "transparent")
                            }
                          >
                            {/* Checkbox */}
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                border: `1.5px solid ${done ? phase.accent : "#333"}`,
                                borderRadius: "3px",
                                background: done ? phase.accent : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "1px",
                                transition: "all 0.15s",
                              }}
                            >
                              {done && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#000",
                                    fontWeight: "900",
                                    lineHeight: 1,
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>

                            {/* Step number */}
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#444",
                                flexShrink: 0,
                                marginTop: "2px",
                                minWidth: "18px",
                              }}
                            >
                              {mIdx + 1}.
                            </span>

                            {/* Text */}
                            <span
                              style={{
                                fontSize: "12px",
                                color: done ? "#555" : "#c0c0c0",
                                lineHeight: "1.6",
                                textDecoration: done
                                  ? "line-through"
                                  : "none",
                                flex: 1,
                              }}
                            >
                              {micro}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
