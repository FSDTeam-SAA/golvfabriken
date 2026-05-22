/**
 * Translation Validator Script
 * 
 * Compares English and Swedish translation files to detect:
 * - Missing translations in Swedish
 * - Extra translations in Swedish (not in English)
 * - Key mismatches between language files
 * - Completeness percentage
 * 
 * Usage:
 *   pnpm tsx src/lib/i18n/translation-validator.ts
 * 
 * Features:
 * - Deep comparison of nested translation objects
 * - Identifies missing keys at all nesting levels
 * - Calculates translation completeness percentage
 * - Generates actionable report with specific missing keys
 */

import * as fs from "fs"
import * as path from "path"

interface ValidationResult {
  valid: boolean
  missingInSwedish: string[]
  extraInSwedish: string[]
  totalEnglishKeys: number
  totalSwedishKeys: number
  completeness: number
}

class TranslationValidator {
  /**
   * Recursively flatten nested translation object to dot-notation keys
   * Example: { cart: { title: "Cart" } } -> { "cart.title": "Cart" }
   */
  private flattenObject(obj: any, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {}

    for (const key in obj) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey))
      } else {
        result[newKey] = String(value)
      }
    }

    return result
  }

  /**
   * Load and parse JSON translation file
   */
  private loadTranslationFile(filePath: string): Record<string, string> {
    try {
      const content = fs.readFileSync(filePath, "utf-8")
      const parsed = JSON.parse(content)
      return this.flattenObject(parsed)
    } catch (error) {
      console.error(`❌ Error loading file ${filePath}:`, error)
      return {}
    }
  }

  /**
   * Validate Swedish translations against English
   */
  validate(englishPath: string, swedishPath: string): ValidationResult {
    const english = this.loadTranslationFile(englishPath)
    const swedish = this.loadTranslationFile(swedishPath)

    const englishKeys = Object.keys(english)
    const swedishKeys = Object.keys(swedish)

    const missingInSwedish = englishKeys.filter(key => !swedish[key])
    const extraInSwedish = swedishKeys.filter(key => !english[key])

    const totalEnglishKeys = englishKeys.length
    const totalSwedishKeys = swedishKeys.length
    const completeness = totalEnglishKeys > 0
      ? ((totalEnglishKeys - missingInSwedish.length) / totalEnglishKeys) * 100
      : 0

    return {
      valid: missingInSwedish.length === 0 && extraInSwedish.length === 0,
      missingInSwedish,
      extraInSwedish,
      totalEnglishKeys,
      totalSwedishKeys,
      completeness,
    }
  }

  /**
   * Print validation report
   */
  printReport(result: ValidationResult): void {
    console.log("\n========================================")
    console.log("  TRANSLATION VALIDATION REPORT")
    console.log("========================================\n")

    console.log(`English keys: ${result.totalEnglishKeys}`)
    console.log(`Swedish keys: ${result.totalSwedishKeys}`)
    console.log(`Completeness: ${result.completeness.toFixed(2)}%\n`)

    if (result.valid) {
      console.log("✅ All translations are complete and consistent!\n")
      return
    }

    if (result.missingInSwedish.length > 0) {
      console.log(`⚠️  Missing in Swedish (${result.missingInSwedish.length}):\n`)
      result.missingInSwedish.forEach(key => {
        console.log(`   - ${key}`)
      })
      console.log()
    }

    if (result.extraInSwedish.length > 0) {
      console.log(`⚠️  Extra in Swedish (not in English) (${result.extraInSwedish.length}):\n`)
      result.extraInSwedish.forEach(key => {
        console.log(`   - ${key}`)
      })
      console.log()
    }

    console.log("---\n")

    if (result.missingInSwedish.length > 0) {
      console.log("💡 Action Required:")
      console.log("   Add missing Swedish translations to:")
      console.log("   src/lib/i18n/locales/sv/common.json\n")
    }

    if (result.extraInSwedish.length > 0) {
      console.log("💡 Optional:")
      console.log("   Remove extra Swedish keys or add them to English file\n")
    }
  }

  /**
   * Generate suggestions for missing translations
   */
  generateTranslationSuggestions(
    englishPath: string,
    missingKeys: string[]
  ): Record<string, string> {
    const english = this.loadTranslationFile(englishPath)
    const suggestions: Record<string, string> = {}

    missingKeys.forEach(key => {
      const englishValue = english[key]
      if (englishValue) {
        suggestions[key] = `[TRANSLATE] ${englishValue}`
      }
    })

    return suggestions
  }

  /**
   * Save validation report to JSON
   */
  saveReport(result: ValidationResult, outputPath: string): void {
    const report = {
      validatedAt: new Date().toISOString(),
      ...result,
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`📝 Validation report saved to: ${outputPath}\n`)
  }
}

// Run validator
const validator = new TranslationValidator()
const localesDir = path.join(__dirname, "locales")

console.log("🔍 Validating translations...\n")

const englishPath = path.join(localesDir, "en/common.json")
const swedishPath = path.join(localesDir, "sv/common.json")

const result = validator.validate(englishPath, swedishPath)
validator.printReport(result)

if (!result.valid && result.missingInSwedish.length > 0) {
  console.log("📝 Generating translation suggestions...\n")
  const suggestions = validator.generateTranslationSuggestions(
    englishPath,
    result.missingInSwedish
  )

  const suggestionsPath = path.join(__dirname, "translation-suggestions.json")
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2))
  console.log(`💡 Suggestions saved to: ${suggestionsPath}\n`)
}

validator.saveReport(result, path.join(__dirname, "validation-report.json"))

// Exit with error code if validation failed
if (!result.valid) {
  process.exit(1)
}
