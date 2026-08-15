# 🌍 Översättningssystem - Snabbstart

## Översikt

Ett komplett, professionellt översättningssystem (i18n) för Golvfabriken med svenska som standardspråk.

---

## ✅ Vad som är färdigt

✅ i18next och react-i18next installerat  
✅ 245+ översättningsnycklar (svenska + engelska)  
✅ Automatiska verktyg (scanner, validator, test)  
✅ Translation Memory med 60+ vanliga fraser  
✅ Komplett dokumentation  
✅ Stöd för variabler och pluralisering  

---

## 📖 Dokumentation

| Fil | Beskrivning |
|-----|-------------|
| `TRANSLATION_GUIDE.md` | Fullständig användningsguide (läs denna först!) |
| `TRANSLATION_CHANGELOG.md` | Detaljerad ändringslogg och teknisk dokumentation |
| `IMPLEMENTATION_SUMMARY.md` | Sammanfattning av implementeringen |

---

## 🚀 Snabbstart

### 1. Använd översättningar i en komponent

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

### 2. Översättning med variabler

```tsx
const { t } = useTranslation()

<p>{t("product.showingResults", { count: 25 })}</p>
// Output: "Visar 25 resultat"
```

### 3. Kör översättningsverktyg

```bash
cd apps/storefront

# Hitta hårdkodade strängar
pnpm tsx src/lib/i18n/translation-scanner.ts

# Validera fullständighet
pnpm tsx src/lib/i18n/translation-validator.ts

# Testa alla komponenter
pnpm tsx src/lib/i18n/translation-test.ts
```

---

## 📁 Filstruktur

```
src/lib/i18n/
├── config.ts                    # i18n-konfiguration
├── locales/
│   ├── sv/
│   │   └── common.json         # Svenska översättningar (245+ nycklar)
│   └── en/
│       └── common.json         # Engelska översättningar (245+ nycklar)
├── translation-scanner.ts      # Hitta hårdkodade strängar
├── translation-validator.ts    # Validera fullständighet
├── translation-test.ts         # Testa komponenter
└── translation-memory.ts       # Översättningsminne (60+ fraser)

src/lib/hooks/
└── use-translation.ts          # React hook för översättningar
```

---

## 🔑 Översättningsnycklar

Nycklar följer strukturen: `{kategori}.{underkategori}.{nyckel}`

**Exempel:**
- `nav.cart` → "Varukorg"
- `cart.checkout` → "Gå till kassan"
- `form.validation.emailRequired` → "E-postadress krävs"
- `product.addToCart` → "Lägg i varukorg"

**Tillgängliga kategorier:**
- `nav` - Navigation
- `cart` - Varukorg
- `checkout` - Kassa
- `form` - Formulär
- `product` - Produkter
- `order` - Beställningar
- `payment` - Betalning
- `error` - Fel
- `footer` - Sidfot
- `golvfabriken` - Brand-specifikt
- `common` - Allmänt
- `accessibility` - Tillgänglighet

---

## 🛠️ Verktyg

### Translation Scanner

Hittar hårdkodade engelska strängar i komponenter.

```bash
pnpm tsx src/lib/i18n/translation-scanner.ts
```

**Output:**
- Konsolrapport med alla hittade strängar
- `scan-report.json` med detaljer

### Translation Validator

Validerar att svenska och engelska översättningsfiler är kompletta.

```bash
pnpm tsx src/lib/i18n/translation-validator.ts
```

**Output:**
- Fullständighetsprocent
- Lista över saknade översättningar
- `validation-report.json`
- `translation-suggestions.json`

### Translation Test Tool

Testar alla komponenter i svenskt läge.

```bash
pnpm tsx src/lib/i18n/translation-test.ts
```

**Output:**
- Pass/fail för varje komponent
- Lista över saknade nycklar
- `test-report.json`

### Translation Memory

Återanvändbar cache av översättningar.

```tsx
import { translationMemory } from '@/lib/i18n/translation-memory'

// Hitta översättning
const result = translationMemory.find('Add to cart')
// { english: "Add to cart", swedish: "Lägg i varukorg", ... }

// Hitta liknande
const similar = translationMemory.findSimilar('Add to wishlist')
```

---

## ⏭️ Nästa steg

### 1. Översätt komponenter

För varje komponent:

1. Importera `useTranslation`:
   ```tsx
   import { useTranslation } from "@/lib/hooks/use-translation"
   ```

2. Använd i komponenten:
   ```tsx
   const { t } = useTranslation()
   ```

3. Ersätt hårdkodad text:
   ```tsx
   // Före:
   <h1>Your cart is empty</h1>
   
   // Efter:
   <h1>{t("cart.empty")}</h1>
   ```

### 2. Lägg till saknade nycklar

Om en översättningsnyckel saknas, lägg till den i både:
- `src/lib/i18n/locales/sv/common.json`
- `src/lib/i18n/locales/en/common.json`

### 3. Validera och testa

```bash
# Kör alla verktyg
pnpm tsx src/lib/i18n/translation-scanner.ts
pnpm tsx src/lib/i18n/translation-validator.ts
pnpm tsx src/lib/i18n/translation-test.ts

# Starta dev-server
pnpm dev
```

### 4. Verifiera visuellt

Navigera genom sidan och kontrollera att:
- ✅ Ingen engelsk text visas
- ✅ Alla formulär är på svenska
- ✅ Felmeddelanden är på svenska
- ✅ Knappar och länkar är på svenska

---

## 📋 Checklista för översättning

- [ ] Importera `useTranslation` hook
- [ ] Ersätt all hårdkodad engelsk text med `t()` anrop
- [ ] Översätt formuläretiketter och placeholders
- [ ] Översätt valideringsmeddelanden
- [ ] Översätt knappar och CTAs
- [ ] Översätt `alt` attribut för bilder
- [ ] Översätt `aria-label` för tillgänglighet
- [ ] Kör translation scanner
- [ ] Kör translation validator
- [ ] Testa visuellt

---

## 🎓 Exempel

### Enkel översättning

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function CartButton() {
  const { t } = useTranslation()
  return <button>{t("cart.checkout")}</button>
}
```

### Med variabler

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function ProductCount({ count }: { count: number }) {
  const { t } = useTranslation()
  return <p>{t("product.showingResults", { count })}</p>
}
```

### Formulär

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function AddressForm() {
  const { t } = useTranslation()
  
  return (
    <div>
      <label>{t("form.firstName")}</label>
      <input placeholder={t("form.firstName")} />
      
      <label>{t("form.email")}</label>
      <input 
        type="email" 
        placeholder={t("form.email")}
        aria-label={t("form.email")}
      />
    </div>
  )
}
```

### Felhantering

```tsx
import { useTranslation } from "@/lib/hooks/use-translation"

function ErrorMessage({ error }: { error: string }) {
  const { t } = useTranslation()
  
  if (!error) return null
  
  return (
    <div className="error">
      <p>{t("error.somethingWentWrong")}</p>
      <button>{t("error.tryAgain")}</button>
    </div>
  )
}
```

---

## 🆘 Felsökning

### Problem: Översättning visas som nyckel

**Symptom:** `cart.title` visas istället för "Varukorg"

**Lösning:**
1. Kontrollera att nyckeln finns i `locales/sv/common.json`
2. Verifiera att sökvägen är korrekt (dot-notation)
3. Kontrollera att i18n är initialiserat i `__root.tsx`

### Problem: TypeScript-fel

**Symptom:** TypeScript klagar på översättningsnycklar

**Lösning:**
Översättningsnycklar är strings, inget typstöd behövs. Om fel uppstår, kontrollera:
1. Att `useTranslation` är korrekt importerat
2. Att `t()` funktionen används korrekt

---

## 📊 Status

| Komponent | Status |
|-----------|--------|
| **i18n Infrastructure** | ✅ Komplett |
| **Översättningsnycklar** | ✅ 245+ |
| **Verktyg** | ✅ 4 verktyg färdiga |
| **Dokumentation** | ✅ Komplett |
| **Komponenter** | ⏳ 0/69 översatta |

---

## 📞 Hjälp och support

- **Fullständig guide:** Se `TRANSLATION_GUIDE.md`
- **Tekniska detaljer:** Se `TRANSLATION_CHANGELOG.md`
- **Sammanfattning:** Se `IMPLEMENTATION_SUMMARY.md`
- **Källkod:** `src/lib/i18n/`

---

**Skapad:** 2026-05-09  
**Version:** 1.0.0  
**Språk:** Svenska (sv) som standard, Engelska (en) som fallback
