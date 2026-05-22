# Guide: Produktspecifikationer kopplade till Backend

## Översikt
Specifikationstabellen på produktsidor är nu **fullständigt kopplad till backend**. All data kommer från Medusa-databasen och kan ändras via admin-panelen eller API.

## Hur det fungerar

### Datakällor
Tabellen hämtar data från två huvudkällor:

1. **Product-fält** (standardfält i Medusa):
   - `material` - Material (t.ex. "Massiv ek")
   - `weight` - Vikt i kg
   - `length` - Längd i mm
   - `width` - Bredd i mm
   - `height` - Höjd i mm

2. **Metadata** (anpassade fält):
   - `unit` - Enhet (t.ex. "m²")
   - `thickness` - Tjocklek
   - `wear_class` - Slitklass
   - `installation` - Läggningssätt
   - `package_size` - Förpackningsstorlek
   - `finish` - Ytbehandling
   - `underfloor_heating` - Golvvärme
   - `fire_class` - Brandsäkerhetsklass
   - `acclimation_time` - Acklimatiseringstid
   - ...och alla andra metadata-fält du lägger till!

### Dynamisk uppbyggnad
- Tabellen bygger **automatiskt** kategorier baserat på vilken data som finns
- Om ett fält är tomt eller saknas visas det inte i tabellen
- Nya metadata-fält läggs automatiskt till under "Övriga egenskaper"
- Om inga specifikationer finns visas meddelandet "Inga specifikationer tillgängliga"

## Uppdatera produktspecifikationer

### Via Admin Dashboard
1. Gå till admin-panelen
2. Navigera till Produkter
3. Välj en produkt
4. Scrolla ner till "Metadata"-sektionen
5. Lägg till eller ändra metadata-fält
6. Ändringarna syns **omedelbart** på produktsidan

### Via API/Workflow
```typescript
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

await updateProductsWorkflow(container).run({
  input: {
    products: [
      {
        id: "prod_xxx",
        // Standardfält
        material: "Massiv ek",
        weight: 18.5,
        length: 2200,
        width: 220,
        height: 20,
        // Metadata
        metadata: {
          unit: "m²",
          thickness: "20 mm",
          wear_class: "34",
          installation: "Limmat",
          package_size: "2,42 m²/paket",
          finish: "Oljad",
          underfloor_heating: "Ja",
          fire_class: "Cfl-s1",
          acclimation_time: "48 timmar",
          // Lägg till valfria fält här
          custom_field: "Värde"
        }
      }
    ]
  }
});
```

## Kategorier i tabellen

Tabellen organiserar automatiskt specifikationer i dessa kategorier:

1. **Allmän information**
   - Enhet, Tjocklek, Slitklass, Material, Vikt

2. **Dimensioner**
   - Längd, Bredd, Höjd, Förpackning

3. **Installation**
   - Läggningssätt, Installationsmetod, Acklimatiseringstid, Tillbehör som krävs

4. **Övriga egenskaper**
   - Alla andra metadata-fält som inte passar ovanstående kategorier

## Exempel: Fullständig produktspecifikation

```json
{
  "material": "Massiv ek",
  "weight": 18.5,
  "length": 2200,
  "width": 220,
  "height": 20,
  "metadata": {
    "unit": "m²",
    "thickness": "20 mm",
    "wear_class": "34",
    "installation": "Limmat",
    "package_size": "2,42 m²/paket",
    "finish": "Oljad",
    "underfloor_heating": "Ja",
    "fire_class": "Cfl-s1",
    "acclimation_time": "48 timmar",
    "suitable_for": "Vardagsrum, sovrum, hall",
    "formaldehyde": "E1",
    "climate_requirements": "18-24°C, 40-60% RF"
  }
}
```

## Fördelar med denna lösning

✅ **Ingen hårdkodad data** - All information kommer från backend
✅ **Flexibel** - Lägg till nya fält när som helst utan kodändringar
✅ **Admin-vänlig** - Uppdatera via admin-panelen
✅ **Automatisk formattering** - Metadata-nycklar formateras automatiskt (t.ex. "wear_class" → "Wear Class")
✅ **Smart filtrering** - Tomma fält visas inte
✅ **Konsekvent** - Samma data visas i admin och storefront

## Testa ändringarna

1. Öppna admin-dashboarden
2. Uppdatera en produkts metadata
3. Gå till produktsidan i storefronten
4. Bekräfta att ändringarna syns i specifikationstabellen

Allt är nu **fullt integrerat med backend**!
