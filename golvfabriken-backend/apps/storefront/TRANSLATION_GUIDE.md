# Translation Guide - Golvfabriken

## Overview

This project uses **i18next** and **react-i18next** for internationalization (i18n). The default language is **Swedish (sv)**, with English (en) as a fallback.

---

## 📂 File Structure

```
src/lib/i18n/
├── config.ts                      # i18n configuration
├── locales/
│   ├── sv/
│   │   └── common.json           # Swedish translations
│   └── en/
│       └── common.json           # English translations
├── translation-scanner.ts         # Tool to detect hardcoded English strings
├── translation-validator.ts       # Tool to validate translation completeness
└── translation-memory.ts          # Translation memory system for consistency
```

---

## 🚀 Usage in Components

### 1. Basic Usage

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t("cart.title")}</h1>
      <button>{t("cart.checkout")}</button>
    </div>
  )
}
```

### 2. Interpolation (Variables)

Translations support variable interpolation:

**Translation file (sv/common.json):**
```json
{
  "product": {
    "showingResults": "Visar {{count}} resultat"
  }
}
```

**Component:**
```tsx
const { t } = useTranslation()

return <p>{t("product.showingResults", { count: 25 })}</p>
// Output: "Visar 25 resultat"
```

### 3. Pluralization

i18next supports automatic pluralization:

**Translation file (sv/common.json):**
```json
{
  "time": {
    "minutesAgo": "{{count}} minut sedan",
    "minutesAgo_plural": "{{count}} minuter sedan"
  }
}
```

**Component:**
```tsx
const { t } = useTranslation()

return <p>{t("time.minutesAgo", { count: 1 })}</p>  // "1 minut sedan"
return <p>{t("time.minutesAgo", { count: 5 })}</p>  // "5 minuter sedan"
```

### 4. Context Comments

Use JSX comments to provide context for translators:

```tsx
{/* Context: Button to submit checkout form */}
<button>{t("checkout.reviewStep.placeOrder")}</button>

{/* Context: Error message shown when form validation fails */}
<p className="error">{t("form.validation.emailRequired")}</p>
```

---

## 📖 Translation Keys Structure

Translation keys follow a **hierarchical dot-notation** structure:

```
{category}.{subcategory}.{key}
```

### Available Categories:

| Category | Description | Example Keys |
|----------|-------------|--------------|
| `nav` | Navigation elements | `nav.cart`, `nav.shop`, `nav.search` |
| `cart` | Shopping cart UI | `cart.empty`, `cart.checkout`, `cart.quantity` |
| `checkout` | Checkout flow | `checkout.progress.addresses`, `checkout.reviewStep.placeOrder` |
| `form` | Form labels and validation | `form.firstName`, `form.validation.emailRequired` |
| `product` | Product pages | `product.addToCart`, `product.outOfStock` |
| `order` | Order confirmation | `order.thankYou`, `order.orderNumber` |
| `payment` | Payment methods | `payment.creditCard`, `payment.securePayment` |
| `error` | Error messages | `error.somethingWentWrong`, `error.tryAgain` |
| `footer` | Footer links | `footer.privacyPolicy`, `footer.termsOfService` |
| `golvfabriken` | Brand-specific content | `golvfabriken.hero.title`, `golvfabriken.trust.experience` |
| `common` | Reusable UI text | `common.loading`, `common.save`, `common.cancel` |
| `accessibility` | ARIA labels and alt texts | `accessibility.closeMenu`, `accessibility.productImage` |

---

## 🛠️ Translation Tools

### 1. Translation Scanner

Scans all components for hardcoded English strings.

**Run:**
```bash
cd apps/storefront
pnpm tsx src/lib/i18n/translation-scanner.ts
```

**Output:**
- Console report of all hardcoded strings
- `scan-report.json` with detailed findings
- Suggested translation keys for each string

### 2. Translation Validator

Compares English and Swedish translation files to ensure completeness.

**Run:**
```bash
cd apps/storefront
pnpm tsx src/lib/i18n/translation-validator.ts
```

**Output:**
- Completeness percentage
- List of missing Swedish translations
- List of extra Swedish keys (not in English)
- `validation-report.json` with full details
- `translation-suggestions.json` with missing entries

### 3. Translation Memory

A system for tracking and reusing translations consistently across the project.

**Features:**
- Stores translation pairs (English → Swedish) with context
- Fuzzy search for similar translations
- Usage tracking for frequently used phrases
- Export/import functionality

**Example:**
```typescript
import { translationMemory } from '@/lib/i18n/translation-memory'

// Find existing translation
const translation = translationMemory.find('Add to cart')
// Returns: { english: "Add to cart", swedish: "Lägg i varukorg", key: "product.addToCart", ... }

// Find similar translations
const similar = translationMemory.findSimilar('Add to wishlist')
// Returns array of similar entries
```

---

## ✅ Translation Checklist

When translating a component:

- [ ] Import and use the `useTranslation` hook
- [ ] Replace **all** hardcoded English strings with `t()` calls
- [ ] Translate form labels, placeholders, and validation messages
- [ ] Translate button text and CTAs
- [ ] Translate error messages and loading states
- [ ] Translate `alt` attributes for images
- [ ] Translate `aria-label` attributes for accessibility
- [ ] Translate `placeholder` attributes for inputs
- [ ] Translate tooltip and title attributes
- [ ] Add context comments for ambiguous strings
- [ ] Run validation script to ensure completeness
- [ ] Test the component in Swedish mode

---

## 🧪 Testing Translations

### Visual Testing

1. Start the development server:
```bash
pnpm dev
```

2. Navigate through all pages and verify:
   - No English text appears
   - All buttons, labels, and messages are in Swedish
   - Pluralization works correctly
   - Variable interpolation displays correctly

### Automated Testing

Run the translation scanner to detect any remaining hardcoded English:

```bash
pnpm tsx src/lib/i18n/translation-scanner.ts
```

---

## 📝 Adding New Translations

### Step 1: Add to Translation Files

**English (en/common.json):**
```json
{
  "myFeature": {
    "title": "My Feature Title",
    "description": "This is a description"
  }
}
```

**Swedish (sv/common.json):**
```json
{
  "myFeature": {
    "title": "Min funktionstitel",
    "description": "Detta är en beskrivning"
  }
}
```

### Step 2: Use in Component

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function MyFeature() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t("myFeature.title")}</h1>
      <p>{t("myFeature.description")}</p>
    </div>
  )
}
```

### Step 3: Validate

```bash
pnpm tsx src/lib/i18n/translation-validator.ts
```

---

## 🌍 Changing Language

The default language is Swedish. To change it dynamically:

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation()

  return (
    <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="sv">Svenska</option>
      <option value="en">English</option>
    </select>
  )
}
```

---

## 🔍 Common Patterns

### Form Validation Messages

```tsx
const { t } = useTranslation()

const validateEmail = (email: string) => {
  if (!email) {
    return t("form.validation.emailRequired") // "E-postadress krävs"
  }
  if (!isValidEmail(email)) {
    return t("form.validation.emailInvalid") // "Ogiltig e-postadress"
  }
  return null
}
```

### Conditional Rendering

```tsx
const { t } = useTranslation()

return (
  <div>
    {isLoading && <p>{t("common.loading")}</p>}
    {error && <p>{t("error.somethingWentWrong")}</p>}
    {success && <p>{t("order.thankYou")}</p>}
  </div>
)
```

### Array Mapping

```tsx
const { t } = useTranslation()

const steps = [
  { key: "addresses", label: t("checkout.progress.addresses") },
  { key: "delivery", label: t("checkout.progress.delivery") },
  { key: "payment", label: t("checkout.progress.payment") },
  { key: "review", label: t("checkout.progress.review") },
]

return (
  <ol>
    {steps.map((step) => (
      <li key={step.key}>{step.label}</li>
    ))}
  </ol>
)
```

---

## 🚨 Important Notes

### Do NOT translate:

- Variable names, function names, class names
- Import paths
- CSS class names (Tailwind classes)
- API endpoint URLs
- Technical error codes
- Data attribute values (unless displayed to users)

### DO translate:

- All visible text rendered to the DOM
- Form labels, placeholders, validation messages
- Button text, link text
- Page titles, headings, descriptions
- Error messages shown to users
- Alt attributes for images
- ARIA labels for accessibility
- Tooltips and title attributes

---

## 📊 Translation Statistics

Run the validation script to see current translation coverage:

```bash
pnpm tsx src/lib/i18n/translation-validator.ts
```

**Example output:**
```
========================================
  TRANSLATION VALIDATION REPORT
========================================

English keys: 245
Swedish keys: 245
Completeness: 100.00%

✅ All translations are complete and consistent!
```

---

## 🤝 Contributing Translations

When adding new features:

1. Write the component with hardcoded English text first
2. Run the translation scanner to identify all strings
3. Add all keys to both `en/common.json` and `sv/common.json`
4. Replace hardcoded strings with `t()` calls
5. Run the validation script to ensure completeness
6. Test the component in Swedish mode

---

## 📚 Reference

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Pluralization](https://www.i18next.com/translation-function/plurals)
- [i18next Interpolation](https://www.i18next.com/translation-function/interpolation)

---

## 🆘 Troubleshooting

### Translation not appearing

**Problem:** `t('my.key')` returns the key itself instead of the translation.

**Solutions:**
1. Check that the key exists in `locales/sv/common.json`
2. Verify the key path is correct (dot notation)
3. Ensure i18n is properly initialized in `__root.tsx`
4. Check browser console for i18n errors

### Translations loading in English

**Problem:** Page loads in English before switching to Swedish.

**Solutions:**
1. Verify default language in `config.ts` is set to `"sv"`
2. Check that `lang` attribute on `<html>` tag is `"sv"`
3. Ensure SSR hydration is not causing mismatch

### Pluralization not working

**Problem:** Plural forms not displaying correctly.

**Solutions:**
1. Ensure you're passing `count` parameter: `t('key', { count: 5 })`
2. Verify both singular and plural forms exist in translation file
3. Check plural key naming: `key` and `key_plural`

---

## 📧 Support

For questions about translations or i18n setup, please refer to this guide or check the existing translation files for examples.
