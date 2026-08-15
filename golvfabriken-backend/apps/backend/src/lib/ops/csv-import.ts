export type CsvParseOptions = {
  delimiter?: "," | ";" | "\t";
  trimValues?: boolean;
};

export type CsvRowRecord = Record<string, string>;

export type CsvParseResult = {
  headers: string[];
  rows: CsvRowRecord[];
  ignoredLineCount: number;
};

export type ProductCatalogCsvValidationIssue = {
  row: number;
  field: string;
  code:
    | "MISSING_REQUIRED"
    | "INVALID_NUMBER"
    | "INVALID_BOOLEAN"
    | "DUPLICATE_HANDLE"
    | "DUPLICATE_SKU";
  message: string;
};

export type ProductCatalogCsvValidationResult = {
  ok: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  requiredHeadersMissing: string[];
  issues: ProductCatalogCsvValidationIssue[];
  preview: CsvRowRecord[];
};

const defaultRequiredHeaders = [
  "handle",
  "title",
  "sku",
  "price",
  "currency_code",
];

const parseLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
};

const normalizeHeader = (header: string) => {
  return String(header || "")
    .trim()
    .toLowerCase();
};

const parseBoolean = (value: string) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (["true", "1", "yes", "y", "ja"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "nej"].includes(normalized)) {
    return false;
  }

  return null;
};

const parseNumber = (value: string) => {
  if (!String(value || "").trim()) {
    return undefined;
  }

  const parsed = Number(String(value).replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
};

export const parseCsvContent = (
  content: string,
  options: CsvParseOptions = {}
): CsvParseResult => {
  const delimiter = options.delimiter || ",";
  const trimValues = options.trimValues !== false;
  const lines = String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (!nonEmptyLines.length) {
    return {
      headers: [],
      rows: [],
      ignoredLineCount: 0,
    };
  }

  const headers = parseLine(nonEmptyLines[0], delimiter).map((item) =>
    normalizeHeader(item)
  );
  const rows: CsvRowRecord[] = [];
  let ignoredLineCount = 0;

  for (let i = 1; i < nonEmptyLines.length; i += 1) {
    const rawValues = parseLine(nonEmptyLines[i], delimiter);

    if (!rawValues.length) {
      ignoredLineCount += 1;
      continue;
    }

    const record: CsvRowRecord = {};

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      const header = headers[columnIndex];

      if (!header) {
        continue;
      }

      const value = rawValues[columnIndex] ?? "";
      record[header] = trimValues ? String(value).trim() : String(value);
    }

    rows.push(record);
  }

  return {
    headers,
    rows,
    ignoredLineCount,
  };
};

export const validateProductCatalogCsv = (
  rows: CsvRowRecord[],
  headers: string[]
): ProductCatalogCsvValidationResult => {
  const requiredHeadersMissing = defaultRequiredHeaders.filter((header) => {
    return !headers.includes(header);
  });
  const issues: ProductCatalogCsvValidationIssue[] = [];
  const seenHandles = new Set<string>();
  const seenSkus = new Set<string>();
  let validRows = 0;
  let invalidRows = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 2;
    let hasRowIssue = false;

    for (const requiredHeader of defaultRequiredHeaders) {
      const value = String(row[requiredHeader] || "").trim();

      if (!value) {
        issues.push({
          row: rowNumber,
          field: requiredHeader,
          code: "MISSING_REQUIRED",
          message: `${requiredHeader} is required`,
        });
        hasRowIssue = true;
      }
    }

    const handle = String(row.handle || "").trim().toLowerCase();
    const sku = String(row.sku || "").trim().toLowerCase();

    if (handle) {
      if (seenHandles.has(handle)) {
        issues.push({
          row: rowNumber,
          field: "handle",
          code: "DUPLICATE_HANDLE",
          message: `Duplicate handle detected: ${handle}`,
        });
        hasRowIssue = true;
      } else {
        seenHandles.add(handle);
      }
    }

    if (sku) {
      if (seenSkus.has(sku)) {
        issues.push({
          row: rowNumber,
          field: "sku",
          code: "DUPLICATE_SKU",
          message: `Duplicate sku detected: ${sku}`,
        });
        hasRowIssue = true;
      } else {
        seenSkus.add(sku);
      }
    }

    const priceParsed = parseNumber(String(row.price || ""));

    if (priceParsed === null || (typeof priceParsed === "number" && priceParsed < 0)) {
      issues.push({
        row: rowNumber,
        field: "price",
        code: "INVALID_NUMBER",
        message: "price must be a valid non-negative number",
      });
      hasRowIssue = true;
    }

    if (row.inventory_quantity !== undefined && row.inventory_quantity !== "") {
      const quantityParsed = parseNumber(String(row.inventory_quantity || ""));

      if (
        quantityParsed === null ||
        (typeof quantityParsed === "number" && quantityParsed < 0)
      ) {
        issues.push({
          row: rowNumber,
          field: "inventory_quantity",
          code: "INVALID_NUMBER",
          message: "inventory_quantity must be a valid non-negative number",
        });
        hasRowIssue = true;
      }
    }

    if (row.is_tax_inclusive !== undefined && row.is_tax_inclusive !== "") {
      const parsed = parseBoolean(String(row.is_tax_inclusive));

      if (parsed === null) {
        issues.push({
          row: rowNumber,
          field: "is_tax_inclusive",
          code: "INVALID_BOOLEAN",
          message: "is_tax_inclusive must be true/false",
        });
        hasRowIssue = true;
      }
    }

    if (hasRowIssue) {
      invalidRows += 1;
    } else {
      validRows += 1;
    }
  }

  return {
    ok: requiredHeadersMissing.length === 0 && issues.length === 0,
    totalRows: rows.length,
    validRows,
    invalidRows,
    requiredHeadersMissing,
    issues,
    preview: rows.slice(0, 10),
  };
};
