/**
 * Automated Translation Test Tool
 * 
 * Automatically tests all components in Swedish mode and verifies:
 * - No English text appears unintentionally
 * - All translation keys resolve correctly
 * - No missing translation errors in console
 * 
 * This is a conceptual test framework. Actual implementation would require:
 * - Test runner (Vitest, Jest)
 * - React testing library
 * - Component renderer
 * 
 * Usage:
 *   pnpm test:translations
 * 
 * Features:
 * - Renders each component in Swedish mode
 * - Scans rendered output for English words
 * - Reports components with untranslated text
 * - Validates all translation keys exist
 */

import fs from "fs"
import path from "path"

interface TestResult {
  component: string
  passed: boolean
  errors: string[]
  warnings: string[]
}

class TranslationTester {
  private results: TestResult[] = []
  private swedishTranslations: any
  private commonEnglishWords = [
    // Articles and pronouns
    "the", "a", "an", "your", "you", "we", "our", "this", "that",
    // Common verbs
    "add", "view", "show", "hide", "edit", "delete", "save", "cancel", "submit",
    "continue", "go", "back", "next", "select", "enter", "click", "close",
    // Common nouns
    "cart", "checkout", "product", "price", "shipping", "payment", "order",
    "address", "email", "phone", "name", "city", "country", "code",
    // Common adjectives
    "empty", "required", "invalid", "available", "total",
    // Checkout/Cart specific
    "subtotal", "discount", "tax", "quantity",
    // Form related
    "first", "last", "postal", "billing",
  ]

  constructor() {
    this.loadTranslations()
  }

  /**
   * Load Swedish translations for validation
   */
  private loadTranslations(): void {
    try {
      const translationPath = path.join(
        __dirname,
        "locales/sv/common.json"
      )
      const content = fs.readFileSync(translationPath, "utf-8")
      this.swedishTranslations = JSON.parse(content)
    } catch (error) {
      console.error("Failed to load Swedish translations:", error)
      this.swedishTranslations = {}
    }
  }

  /**
   * Recursively flatten nested translation object
   */
  private flattenTranslations(obj: any, prefix = ""): string[] {
    const keys: string[] = []

    for (const key in obj) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...this.flattenTranslations(value, newKey))
      } else {
        keys.push(newKey)
      }
    }

    return keys
  }

  /**
   * Check if a string contains common English words
   */
  private containsEnglishWords(text: string): string[] {
    const found: string[] = []
    const lowerText = text.toLowerCase()

    for (const word of this.commonEnglishWords) {
      // Match whole words only (not substrings)
      const regex = new RegExp(`\\b${word}\\b`, "i")
      if (regex.test(lowerText)) {
        found.push(word)
      }
    }

    return found
  }

  /**
   * Validate that all translation keys in a component exist in the Swedish translation file
   */
  validateTranslationKeys(componentPath: string): TestResult {
    const result: TestResult = {
      component: componentPath,
      passed: true,
      errors: [],
      warnings: [],
    }

    try {
      const content = fs.readFileSync(componentPath, "utf-8")
      const availableKeys = this.flattenTranslations(this.swedishTranslations)

      // Find all t('key') or t("key") calls
      const tCallRegex = /t\(['"]([^'"]+)['"]\)/g
      let match

      while ((match = tCallRegex.exec(content)) !== null) {
        const key = match[1]
        if (!availableKeys.includes(key)) {
          result.errors.push(`Missing translation key: ${key}`)
          result.passed = false
        }
      }

      // Find hardcoded strings (simple heuristic)
      const stringRegex = /['"]([a-zA-Z\s]{4,})['"](?!:)/g
      while ((match = stringRegex.exec(content)) !== null) {
        const text = match[1]
        
        // Skip if it's in an import, className, or looks like a variable
        const line = content.substring(
          content.lastIndexOf("\n", match.index) + 1,
          content.indexOf("\n", match.index)
        )
        
        if (
          line.includes("import") ||
          line.includes("from") ||
          line.includes("className") ||
          text.includes("-") || // Likely a CSS class or identifier
          text.length < 4 // Too short to be meaningful UI text
        ) {
          continue
        }

        const englishWords = this.containsEnglishWords(text)
        if (englishWords.length > 0) {
          result.warnings.push(
            `Possible hardcoded English: "${text}" (words: ${englishWords.join(", ")})`
          )
        }
      }
    } catch (error) {
      result.errors.push(`Failed to read component: ${error}`)
      result.passed = false
    }

    return result
  }

  /**
   * Test all components in a directory
   */
  testDirectory(dir: string): void {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        this.testDirectory(filePath)
      } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        const result = this.validateTranslationKeys(filePath)
        this.results.push(result)
      }
    }
  }

  /**
   * Print test results
   */
  printResults(): void {
    console.log("\n========================================")
    console.log("  TRANSLATION TEST RESULTS")
    console.log("========================================\n")

    const passed = this.results.filter((r) => r.passed).length
    const failed = this.results.filter((r) => !r.passed).length
    const withWarnings = this.results.filter((r) => r.warnings.length > 0).length

    console.log(`Total components tested: ${this.results.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  With warnings: ${withWarnings}\n`)

    if (failed > 0) {
      console.log("FAILURES:\n")
      this.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          console.log(`❌ ${result.component}`)
          result.errors.forEach((error) => {
            console.log(`   - ${error}`)
          })
          console.log()
        })
    }

    if (withWarnings > 0) {
      console.log("WARNINGS:\n")
      this.results
        .filter((r) => r.warnings.length > 0)
        .forEach((result) => {
          console.log(`⚠️  ${result.component}`)
          result.warnings.forEach((warning) => {
            console.log(`   - ${warning}`)
          })
          console.log()
        })
    }

    if (failed === 0 && withWarnings === 0) {
      console.log("✅ All translation tests passed! No issues detected.\n")
    } else {
      console.log(
        `\n📝 Summary: ${failed} failure(s), ${withWarnings} warning(s)\n`
      )
    }
  }

  /**
   * Save test report to JSON
   */
  saveReport(outputPath: string): void {
    const report = {
      testedAt: new Date().toISOString(),
      totalComponents: this.results.length,
      passed: this.results.filter((r) => r.passed).length,
      failed: this.results.filter((r) => !r.passed).length,
      withWarnings: this.results.filter((r) => r.warnings.length > 0).length,
      results: this.results,
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`📝 Test report saved to: ${outputPath}\n`)
  }
}

// Run tests
const tester = new TranslationTester()
const baseDir = path.join(__dirname, "../../")

console.log("🧪 Running translation tests...\n")

tester.testDirectory(path.join(baseDir, "components"))
tester.testDirectory(path.join(baseDir, "pages"))

tester.printResults()
tester.saveReport(path.join(__dirname, "test-report.json"))

// Exit with error code if any tests failed
const failedTests = tester["results"].filter((r) => !r.passed).length
if (failedTests > 0) {
  process.exit(1)
}
