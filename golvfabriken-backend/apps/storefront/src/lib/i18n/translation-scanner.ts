/**
 * Translation Scanner Tool
 * 
 * Detects hardcoded English strings in components and flags them for translation.
 * 
 * Usage:
 *   pnpm tsx src/lib/i18n/translation-scanner.ts
 * 
 * Features:
 * - Scans all .tsx/.ts files in src/components and src/pages
 * - Identifies English text patterns (strings, JSX text, aria-labels, placeholders, alt texts)
 * - Flags hardcoded strings that are not using translation functions
 * - Generates a report of untranslated strings with file locations
 * - Suggests translation keys based on context
 */

import * as fs from "fs"
import * as path from "path"

interface UntranslatedString {
  file: string
  line: number
  text: string
  context: string
  suggestedKey: string
}

const EXCLUDED_PATTERNS = [
  /^[0-9]+$/, // Pure numbers
  /^[a-z]$/, // Single letters
  /^https?:\/\//, // URLs
  /^#[0-9a-fA-F]{3,6}$/, // Hex colors
  /^[^a-zA-Z]+$/, // Non-alphabetic strings (symbols, etc.)
  /^(px|em|rem|%|vh|vw)$/, // CSS units
  /^(true|false|null|undefined)$/, // Keywords
]

const TRANSLATION_PATTERNS = [
  /t\(['"`]([^'"`]+)['"`]\)/, // t('key')
  /useTranslation\(\)/, // useTranslation() hook
  /\{t\(['"`]/, // {t('key')}
]

class TranslationScanner {
  private results: UntranslatedString[] = []
  private scannedFiles = 0
  private totalStrings = 0

  /**
   * Scan a directory recursively for .tsx and .ts files
   */
  scanDirectory(dir: string): void {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        this.scanDirectory(filePath)
      } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        this.scanFile(filePath)
      }
    }
  }

  /**
   * Scan a single file for hardcoded strings
   */
  scanFile(filePath: string): void {
    this.scannedFiles++
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n")

    // Check if file uses translations
    const usesTranslations = TRANSLATION_PATTERNS.some(pattern =>
      pattern.test(content)
    )

    lines.forEach((line, index) => {
      // Find all string literals
      const stringPatterns = [
        /"([^"]+)"/g, // Double quotes
        /'([^']+)'/g, // Single quotes
        /`([^`]+)`/g, // Template literals
      ]

      stringPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(line)) !== null) {
          const text = match[1]
          
          if (this.shouldFlagString(text, line, usesTranslations)) {
            this.totalStrings++
            this.results.push({
              file: filePath,
              line: index + 1,
              text,
              context: line.trim(),
              suggestedKey: this.suggestTranslationKey(text, line),
            })
          }
        }
      })
    })
  }

  /**
   * Determine if a string should be flagged for translation
   */
  private shouldFlagString(text: string, line: string, usesTranslations: boolean): boolean {
    // Skip if string is excluded by patterns
    if (EXCLUDED_PATTERNS.some(pattern => pattern.test(text))) {
      return false
    }

    // Skip if string is too short (likely a variable or key)
    if (text.length < 3) {
      return false
    }

    // Skip if string contains no English letters
    if (!/[a-zA-Z]/.test(text)) {
      return false
    }

    // Skip if already using translation function
    if (line.includes(`t("${text}")`) || line.includes(`t('${text}')`)) {
      return false
    }

    // Skip import statements
    if (line.includes("import") || line.includes("from")) {
      return false
    }

    // Skip className assignments (Tailwind classes)
    if (line.includes("className=") && text.includes("-")) {
      return false
    }

    // Check for common English words (simple heuristic)
    const commonWords = [
      "the",
      "is",
      "are",
      "your",
      "add",
      "to",
      "select",
      "enter",
      "click",
      "view",
      "show",
      "hide",
    ]
    const hasCommonWords = commonWords.some(word =>
      text.toLowerCase().includes(word)
    )

    // If file uses translations and string looks like UI text, flag it
    if (usesTranslations && hasCommonWords) {
      return true
    }

    // Check for specific contexts (labels, placeholders, aria-labels, etc.)
    if (
      line.includes("placeholder=") ||
      line.includes("aria-label=") ||
      line.includes("alt=") ||
      line.includes("title=") ||
      line.includes("label=")
    ) {
      return true
    }

    // Check for JSX text content (text between tags)
    if (line.match(/>.*[a-zA-Z].*</)) {
      return true
    }

    return false
  }

  /**
   * Suggest a translation key based on the string and context
   */
  private suggestTranslationKey(text: string, line: string): string {
    // Determine category from context
    let category = "common"

    if (line.includes("cart") || line.includes("Cart")) category = "cart"
    else if (line.includes("checkout") || line.includes("Checkout")) category = "checkout"
    else if (line.includes("product") || line.includes("Product")) category = "product"
    else if (line.includes("nav") || line.includes("Nav")) category = "nav"
    else if (line.includes("footer") || line.includes("Footer")) category = "footer"
    else if (line.includes("error") || line.includes("Error")) category = "error"
    else if (line.includes("form") || line.includes("Form")) category = "form"

    // Generate key from text (camelCase)
    const key = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join("")

    return `${category}.${key}`
  }

  /**
   * Generate and print report
   */
  printReport(): void {
    console.log("\n========================================")
    console.log("  TRANSLATION SCANNER REPORT")
    console.log("========================================\n")

    console.log(`Files scanned: ${this.scannedFiles}`)
    console.log(`Hardcoded strings found: ${this.totalStrings}\n`)

    if (this.results.length === 0) {
      console.log("✅ No hardcoded strings detected! All strings are properly translated.\n")
      return
    }

    // Group results by file
    const groupedByFile = this.results.reduce(
      (acc, result) => {
        if (!acc[result.file]) acc[result.file] = []
        acc[result.file].push(result)
        return acc
      },
      {} as Record<string, UntranslatedString[]>
    )

    Object.entries(groupedByFile).forEach(([file, strings]) => {
      console.log(`📄 ${file}`)
      console.log(`   Found ${strings.length} hardcoded string(s):\n`)

      strings.forEach(({ line, text, suggestedKey }) => {
        console.log(`   Line ${line}: "${text}"`)
        console.log(`   → Suggested key: ${suggestedKey}\n`)
      })

      console.log("---\n")
    })

    console.log(`\n⚠️  Total: ${this.totalStrings} hardcoded strings need translation.\n`)
  }

  /**
   * Generate JSON report for programmatic use
   */
  saveReport(outputPath: string): void {
    const report = {
      scannedAt: new Date().toISOString(),
      filesScanned: this.scannedFiles,
      totalStrings: this.totalStrings,
      results: this.results,
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`📝 Report saved to: ${outputPath}\n`)
  }
}

// Run scanner
const scanner = new TranslationScanner()
const baseDir = path.join(__dirname, "../../")

console.log("🔍 Scanning for hardcoded English strings...\n")

scanner.scanDirectory(path.join(baseDir, "components"))
scanner.scanDirectory(path.join(baseDir, "pages"))

scanner.printReport()
scanner.saveReport(path.join(__dirname, "scan-report.json"))
