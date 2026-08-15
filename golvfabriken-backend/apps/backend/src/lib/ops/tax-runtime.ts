type CustomerType = "b2c" | "b2b";

type TaxConfigurationLike = {
  id?: string;
  country_code?: string | null;
  region_code?: string | null;
  currency_code?: string | null;
  vat_rate?: number | null;
  is_tax_inclusive?: boolean | null;
  eu_oss_enabled?: boolean | null;
  reverse_charge_enabled?: boolean | null;
  status?: "draft" | "active" | "archived" | string | null;
};

export type TaxQuoteLineInput = {
  sku?: string;
  title?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
};

export type TaxQuoteInput = {
  destination_country: string;
  destination_region?: string;
  customer_type?: CustomerType;
  customer_vat_id?: string;
  currency_code?: string;
  lines: TaxQuoteLineInput[];
  merchant_country_code?: string;
};

export type TaxQuoteResult = {
  status: "ok";
  destination_country: string;
  destination_region?: string;
  currency_code: string;
  source: {
    tax_configuration_id?: string;
    country_code?: string;
    region_code?: string;
    vat_rate: number;
    is_tax_inclusive: boolean;
    eu_oss_enabled: boolean;
    reverse_charge_enabled: boolean;
    reverse_charge_applied: boolean;
  };
  totals: {
    net_amount: number;
    tax_amount: number;
    gross_amount: number;
    line_count: number;
  };
  lines: Array<{
    sku?: string;
    title?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    taxable_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  }>;
  warnings: string[];
};

const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

const roundMoney = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const normalizeCountryCode = (value?: string | null) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const normalizeRegionCode = (value?: string | null) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const isEuCountry = (countryCode?: string | null) => {
  return EU_COUNTRIES.has(normalizeCountryCode(countryCode));
};

const hasValidVatId = (value?: string | null) => {
  const vatId = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}[A-Z0-9]{2,14}$/.test(vatId);
};

const normalizeRate = (value?: number | null) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return numeric;
};

export const pickBestTaxConfiguration = ({
  destinationCountry,
  destinationRegion,
  configurations,
}: {
  destinationCountry: string;
  destinationRegion?: string;
  configurations: TaxConfigurationLike[];
}) => {
  const countryCode = normalizeCountryCode(destinationCountry);
  const regionCode = normalizeRegionCode(destinationRegion);
  const active = configurations.filter((item) => {
    return (item.status || "draft") === "active";
  });
  const countryMatches = active.filter((item) => {
    return normalizeCountryCode(item.country_code) === countryCode;
  });
  const exactRegion = countryMatches.find((item) => {
    return normalizeRegionCode(item.region_code) === regionCode && regionCode.length > 0;
  });

  if (exactRegion) {
    return exactRegion;
  }

  return (
    countryMatches.find((item) => normalizeRegionCode(item.region_code).length === 0) ||
    countryMatches[0] ||
    active[0] ||
    configurations[0] ||
    null
  );
};

export const shouldApplyReverseCharge = ({
  customerType = "b2c",
  customerVatId,
  destinationCountry,
  merchantCountryCode = "SE",
  reverseChargeEnabled,
}: {
  customerType?: CustomerType;
  customerVatId?: string;
  destinationCountry: string;
  merchantCountryCode?: string;
  reverseChargeEnabled: boolean;
}) => {
  if (customerType !== "b2b") {
    return false;
  }

  if (!reverseChargeEnabled || !hasValidVatId(customerVatId)) {
    return false;
  }

  const destination = normalizeCountryCode(destinationCountry);
  const merchant = normalizeCountryCode(merchantCountryCode);

  if (!isEuCountry(destination) || !isEuCountry(merchant)) {
    return false;
  }

  return destination !== merchant;
};

export const buildTaxQuote = ({
  input,
  matchedConfiguration,
}: {
  input: TaxQuoteInput;
  matchedConfiguration?: TaxConfigurationLike | null;
}): TaxQuoteResult => {
  const warnings: string[] = [];
  const configuration = matchedConfiguration || null;
  const destinationCountry = normalizeCountryCode(input.destination_country);
  const destinationRegion = normalizeRegionCode(input.destination_region);
  const merchantCountryCode = normalizeCountryCode(
    input.merchant_country_code || process.env.OPS_MERCHANT_COUNTRY_CODE || "SE"
  );
  const baseRate = normalizeRate(configuration?.vat_rate);
  const isTaxInclusive = Boolean(configuration?.is_tax_inclusive);
  const euOssEnabled = Boolean(configuration?.eu_oss_enabled);
  const reverseChargeEnabled = Boolean(configuration?.reverse_charge_enabled);
  const reverseChargeApplied = shouldApplyReverseCharge({
    customerType: input.customer_type || "b2c",
    customerVatId: input.customer_vat_id,
    destinationCountry,
    merchantCountryCode,
    reverseChargeEnabled,
  });

  if (!configuration) {
    warnings.push("NO_ACTIVE_TAX_CONFIGURATION_MATCHED");
  }

  if (!destinationCountry) {
    warnings.push("MISSING_DESTINATION_COUNTRY");
  }

  const lines = (input.lines || []).map((line) => {
    const quantity = Math.max(Number(line.quantity) || 0, 0);
    const unitPrice = Math.max(Number(line.unit_price) || 0, 0);
    const discount = Math.max(Number(line.discount_amount) || 0, 0);
    const lineBaseAmount = Math.max(quantity * unitPrice - discount, 0);
    const lineRate = reverseChargeApplied ? 0 : normalizeRate(line.tax_rate ?? baseRate);

    let taxableAmount = lineBaseAmount;
    let taxAmount = 0;
    let totalAmount = lineBaseAmount;

    if (isTaxInclusive && lineRate > 0) {
      taxableAmount = roundMoney(lineBaseAmount / (1 + lineRate));
      taxAmount = roundMoney(lineBaseAmount - taxableAmount);
      totalAmount = roundMoney(lineBaseAmount);
    } else {
      taxAmount = roundMoney(taxableAmount * lineRate);
      totalAmount = roundMoney(taxableAmount + taxAmount);
      taxableAmount = roundMoney(taxableAmount);
    }

    return {
      sku: line.sku,
      title: line.title,
      quantity,
      unit_price: roundMoney(unitPrice),
      discount_amount: roundMoney(discount),
      taxable_amount: taxableAmount,
      tax_rate: lineRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    };
  });

  const totals = lines.reduce(
    (acc, line) => {
      acc.net_amount = roundMoney(acc.net_amount + line.taxable_amount);
      acc.tax_amount = roundMoney(acc.tax_amount + line.tax_amount);
      acc.gross_amount = roundMoney(acc.gross_amount + line.total_amount);
      return acc;
    },
    {
      net_amount: 0,
      tax_amount: 0,
      gross_amount: 0,
      line_count: lines.length,
    }
  );

  return {
    status: "ok",
    destination_country: destinationCountry,
    destination_region: destinationRegion || undefined,
    currency_code: String(
      input.currency_code || configuration?.currency_code || "SEK"
    ).toUpperCase(),
    source: {
      tax_configuration_id: configuration?.id,
      country_code: normalizeCountryCode(configuration?.country_code),
      region_code: normalizeRegionCode(configuration?.region_code) || undefined,
      vat_rate: baseRate,
      is_tax_inclusive: isTaxInclusive,
      eu_oss_enabled: euOssEnabled,
      reverse_charge_enabled: reverseChargeEnabled,
      reverse_charge_applied: reverseChargeApplied,
    },
    totals,
    lines,
    warnings,
  };
};
