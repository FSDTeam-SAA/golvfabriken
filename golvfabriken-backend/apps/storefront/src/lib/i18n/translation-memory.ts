/**
 * Translation Memory System
 * 
 * A cache/database of previously translated phrases for consistent reuse across the project.
 * 
 * Features:
 * - Stores translation pairs (English -> Swedish) with context
 * - Provides fuzzy search for similar translations
 * - Suggests reusable translations for new strings
 * - Tracks translation consistency
 * - Export/import functionality for sharing translation memory
 * 
 * Usage:
 *   import { translationMemory } from '@/lib/i18n/translation-memory'
 *   
 *   // Find existing translation
 *   const translation = translationMemory.find('Add to cart')
 *   
 *   // Add new translation
 *   translationMemory.add('Add to cart', 'Lägg i varukorg', 'cart.addToCart')
 *   
 *   // Find similar translations
 *   const similar = translationMemory.findSimilar('Add to wishlist')
 */

interface TranslationEntry {
  english: string
  swedish: string
  key: string
  context: string
  category: string
  usageCount: number
  lastUsed: string
  createdAt: string
}

class TranslationMemory {
  private memory: Map<string, TranslationEntry> = new Map()
  private indexBySwedish: Map<string, string> = new Map()

  constructor() {
    this.loadFromStorage()
    this.initializeCommonPhrases()
  }

  /**
   * Initialize with common phrases from translation files
   */
  private initializeCommonPhrases(): void {
    // Navigation
    this.add("Cart", "Varukorg", "nav.cart", "Navigation link")
    this.add("Checkout", "Gå till kassan", "cart.checkout", "Cart action")
    this.add("Shop", "Produkter", "nav.shop", "Navigation link")
    this.add("Search", "Sök", "nav.search", "Navigation action")
    
    // Common actions
    this.add("Add to Cart", "Lägg i varukorg", "product.addToCart", "Product action")
    this.add("Continue shopping", "Fortsätt handla", "cart.continueShopping", "Cart action")
    this.add("Remove", "Ta bort", "cart.remove", "Cart action")
    this.add("Save", "Spara", "common.save", "Form action")
    this.add("Cancel", "Avbryt", "common.cancel", "Form action")
    this.add("Edit", "Redigera", "common.edit", "Action")
    this.add("Delete", "Ta bort", "common.delete", "Action")
    this.add("Close", "Stäng", "common.close", "UI action")
    this.add("Apply", "Applicera", "common.apply", "Form action")
    
    // Form labels
    this.add("First Name", "Förnamn", "form.firstName", "Form label")
    this.add("Last Name", "Efternamn", "form.lastName", "Form label")
    this.add("Email Address", "E-postadress", "form.email", "Form label")
    this.add("Phone Number", "Telefonnummer", "form.phone", "Form label")
    this.add("Address", "Adress", "form.address", "Form label")
    this.add("City", "Stad", "form.city", "Form label")
    this.add("Postal Code", "Postnummer", "form.postalCode", "Form label")
    this.add("Country", "Land", "form.country", "Form label")
    
    // Validation messages
    this.add("is required", "krävs", "form.validation.required", "Validation suffix")
    this.add("First name is required", "Förnamn krävs", "form.validation.firstNameRequired", "Validation message")
    this.add("Email address is required", "E-postadress krävs", "form.validation.emailRequired", "Validation message")
    this.add("Invalid email address", "Ogiltig e-postadress", "form.validation.emailInvalid", "Validation message")
    
    // Cart
    this.add("Your cart is empty", "Din varukorg är tom", "cart.empty", "Cart state")
    this.add("Subtotal", "Delsumma", "cart.subtotal", "Cart summary")
    this.add("Shipping", "Frakt", "cart.shipping", "Cart summary")
    this.add("Tax", "Moms", "cart.tax", "Cart summary")
    this.add("Total", "Totalt", "cart.total", "Cart summary")
    this.add("Discount", "Rabatt", "cart.discount", "Cart summary")
    this.add("Quantity", "Antal", "cart.quantity", "Cart item property")
    
    // Checkout
    this.add("Addresses", "Adresser", "checkout.progress.addresses", "Checkout step")
    this.add("Delivery", "Leverans", "checkout.progress.delivery", "Checkout step")
    this.add("Payment", "Betalning", "checkout.progress.payment", "Checkout step")
    this.add("Review", "Granska", "checkout.progress.review", "Checkout step")
    this.add("Shipping Address", "Leveransadress", "checkout.addressStep.shippingAddress", "Checkout label")
    this.add("Billing Address", "Faktureringsadress", "checkout.addressStep.billingAddress", "Checkout label")
    this.add("Select shipping method", "Välj leveransmetod", "checkout.deliveryStep.selectShippingMethod", "Checkout instruction")
    this.add("Place order", "Slutför beställning", "checkout.reviewStep.placeOrder", "Checkout action")
    
    // Product
    this.add("Out of Stock", "Slut i lager", "product.outOfStock", "Product status")
    this.add("In Stock", "I lager", "product.inStock", "Product status")
    this.add("Price", "Pris", "product.price", "Product property")
    this.add("Description", "Beskrivning", "product.description", "Product section")
    
    // Error messages
    this.add("Something went wrong", "Något gick fel", "error.somethingWentWrong", "Error message")
    this.add("Try again", "Försök igen", "error.tryAgain", "Error action")
    this.add("Page not found", "Sidan hittades inte", "error.pageNotFound", "Error message")
    this.add("Go to homepage", "Gå till startsidan", "error.goHome", "Error action")
    
    // Common UI
    this.add("Loading...", "Laddar...", "common.loading", "Loading state")
    this.add("Back", "Tillbaka", "common.back", "Navigation")
    this.add("Next", "Nästa", "common.next", "Navigation")
    this.add("Previous", "Föregående", "common.previous", "Navigation")
    this.add("View more", "Visa mer", "common.viewMore", "Action")
    this.add("Show more", "Visa fler", "common.showMore", "Action")
    this.add("See all", "Se alla", "common.seeAll", "Action")
    
    // Footer
    this.add("Privacy Policy", "Integritetspolicy", "footer.privacyPolicy", "Footer link")
    this.add("Terms of Service", "Användarvillkor", "footer.termsOfService", "Footer link")
    this.add("All rights reserved", "Alla rättigheter förbehållna", "footer.allRightsReserved", "Footer text")
    this.add("Contact", "Kontakt", "footer.contact", "Footer link")
    this.add("About us", "Om oss", "footer.about", "Footer link")
  }

  /**
   * Add a translation to memory
   */
  add(
    english: string,
    swedish: string,
    key: string,
    context: string = ""
  ): void {
    const normalizedEnglish = english.toLowerCase().trim()
    const category = key.split(".")[0]

    const entry: TranslationEntry = {
      english,
      swedish,
      key,
      context,
      category,
      usageCount: this.memory.get(normalizedEnglish)?.usageCount || 0,
      lastUsed: new Date().toISOString(),
      createdAt: this.memory.get(normalizedEnglish)?.createdAt || new Date().toISOString(),
    }

    this.memory.set(normalizedEnglish, entry)
    this.indexBySwedish.set(swedish.toLowerCase().trim(), normalizedEnglish)
    this.saveToStorage()
  }

  /**
   * Find exact translation match
   */
  find(english: string): TranslationEntry | undefined {
    const entry = this.memory.get(english.toLowerCase().trim())
    
    if (entry) {
      // Increment usage count
      entry.usageCount++
      entry.lastUsed = new Date().toISOString()
      this.saveToStorage()
    }
    
    return entry
  }

  /**
   * Find translation by Swedish text (reverse lookup)
   */
  findBySwedish(swedish: string): TranslationEntry | undefined {
    const englishKey = this.indexBySwedish.get(swedish.toLowerCase().trim())
    return englishKey ? this.memory.get(englishKey) : undefined
  }

  /**
   * Find similar translations using fuzzy matching
   */
  findSimilar(english: string, threshold: number = 0.6): TranslationEntry[] {
    const normalized = english.toLowerCase().trim()
    const results: Array<{ entry: TranslationEntry; score: number }> = []

    this.memory.forEach((entry, key) => {
      const score = this.similarity(normalized, key)
      if (score >= threshold) {
        results.push({ entry, score })
      }
    })

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.entry)
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshtein(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshtein(s1: string, s2: string): number {
    const costs: number[] = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  /**
   * Get all translations in a category
   */
  getByCategory(category: string): TranslationEntry[] {
    const results: TranslationEntry[] = []
    this.memory.forEach((entry) => {
      if (entry.category === category) {
        results.push(entry)
      }
    })
    return results
  }

  /**
   * Get most used translations
   */
  getMostUsed(limit: number = 10): TranslationEntry[] {
    const values: TranslationEntry[] = []
    this.memory.forEach((entry) => values.push(entry))

    return values
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Export translation memory to JSON
   */
  export(): string {
    const entries: Array<{
      memoryKey: string
      english: string
      swedish: string
      translationKey: string
      context: string
      category: string
      usageCount: number
      lastUsed: string
      createdAt: string
    }> = []

    this.memory.forEach((entry, memoryKey) => {
      entries.push({
        memoryKey,
        english: entry.english,
        swedish: entry.swedish,
        translationKey: entry.key,
        context: entry.context,
        category: entry.category,
        usageCount: entry.usageCount,
        lastUsed: entry.lastUsed,
        createdAt: entry.createdAt,
      })
    })

    return JSON.stringify(entries, null, 2)
  }

  /**
   * Import translation memory from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json)
      data.forEach((item: any) => {
        const memoryKey = item.memoryKey || item.key
        this.memory.set(memoryKey, {
          english: item.english,
          swedish: item.swedish,
          key: item.translationKey || item.key,
          context: item.context,
          category: item.category,
          usageCount: item.usageCount || 0,
          lastUsed: item.lastUsed || new Date().toISOString(),
          createdAt: item.createdAt || new Date().toISOString(),
        })
        this.indexBySwedish.set(
          item.swedish.toLowerCase().trim(),
          memoryKey
        )
      })
      this.saveToStorage()
    } catch (error) {
      console.error("Failed to import translation memory:", error)
    }
  }

  /**
   * Save to localStorage (browser) or file system (Node)
   */
  private saveToStorage(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("translationMemory", this.export())
      } catch (error) {
        console.error("Failed to save translation memory:", error)
      }
    }
  }

  /**
   * Load from localStorage (browser) or file system (Node)
   */
  private loadFromStorage(): void {
    if (typeof window !== "undefined") {
      try {
        const data = localStorage.getItem("translationMemory")
        if (data) {
          this.import(data)
        }
      } catch (error) {
        console.error("Failed to load translation memory:", error)
      }
    }
  }

  /**
   * Clear all translations
   */
  clear(): void {
    this.memory.clear()
    this.indexBySwedish.clear()
    this.saveToStorage()
  }

  /**
   * Get statistics
   */
  getStats() {
    const values: TranslationEntry[] = []
    this.memory.forEach((entry) => values.push(entry))

    const categories = new Set(values.map(e => e.category))
    const totalUsageCount = values.reduce((sum, e) => sum + e.usageCount, 0)

    return {
      totalEntries: this.memory.size,
      categories: categories.size,
      totalUsageCount,
      averageUsageCount:
        this.memory.size > 0
          ? totalUsageCount / this.memory.size
          : 0,
    }
  }
}

// Export singleton instance
export const translationMemory = new TranslationMemory()
