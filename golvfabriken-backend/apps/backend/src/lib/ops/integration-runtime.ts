type ConnectorKey = "fraktjakt" | "klarna" | "fortnox";

type ConnectorEnvSpec = {
  key: ConnectorKey;
  requiredKeys: string[];
  baseUrlKey: string;
};

export type IntegrationRuntimeReport = {
  key: ConnectorKey;
  ready: boolean;
  mode: "live" | "skip";
  missingKeys: string[];
  baseUrl?: string;
  skipReason?: string;
};

export type ShippingQuoteItemInput = {
  sku?: string;
  quantity?: number;
  weight_kg?: number;
  volume_m3?: number;
  unit_price?: number;
};

export type ShippingQuotePreviewInput = {
  destination_country?: string;
  postal_code?: string;
  items?: ShippingQuoteItemInput[];
};

export type ShippingQuotePreview = {
  carrier: string;
  service: string;
  amount: number;
  currency_code: string;
  estimated_days: number;
  mode: "live" | "simulated";
  note?: string;
};

export type KlarnaSessionPreviewInput = {
  amount: number;
  currency_code?: string;
  locale?: string;
  order_reference?: string;
};

export type FortnoxExportInput = {
  export_type?: "orders" | "returns" | "settlements";
  period_from?: string;
  period_to?: string;
};

const connectorEnvSpecs: ConnectorEnvSpec[] = [
  {
    key: "fraktjakt",
    requiredKeys: ["FRAKTJAKT_API_URL", "FRAKTJAKT_API_KEY"],
    baseUrlKey: "FRAKTJAKT_API_URL",
  },
  {
    key: "klarna",
    requiredKeys: ["KLARNA_API_BASE_URL", "KLARNA_USERNAME", "KLARNA_PASSWORD"],
    baseUrlKey: "KLARNA_API_BASE_URL",
  },
  {
    key: "fortnox",
    requiredKeys: [
      "FORTNOX_API_BASE_URL",
      "FORTNOX_CLIENT_ID",
      "FORTNOX_CLIENT_SECRET",
      "FORTNOX_ACCESS_TOKEN",
    ],
    baseUrlKey: "FORTNOX_API_BASE_URL",
  },
];

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasValue = (value: string | undefined | null) => {
  return Boolean(String(value || "").trim());
};

export const isOpsIntegrationSimulationEnabled = () => {
  const value = String(process.env.OPS_INTEGRATION_SIMULATION_MODE || "true")
    .trim()
    .toLowerCase();

  if (value === "false" || value === "0" || value === "no") {
    return false;
  }

  return true;
};

export const getIntegrationRuntimeReport = (
  key: ConnectorKey
): IntegrationRuntimeReport => {
  const spec = connectorEnvSpecs.find((item) => item.key === key);

  if (!spec) {
    return {
      key,
      ready: false,
      mode: "skip",
      missingKeys: [],
      skipReason: "UNSUPPORTED_CONNECTOR",
    };
  }

  const missingKeys = spec.requiredKeys.filter((envKey) => {
    return !hasValue(process.env[envKey]);
  });
  const ready = missingKeys.length === 0;
  const baseUrl = process.env[spec.baseUrlKey];

  return {
    key,
    ready,
    mode: ready ? "live" : "skip",
    missingKeys,
    baseUrl: hasValue(baseUrl) ? String(baseUrl).trim() : undefined,
    skipReason: ready ? undefined : `SKIP_MISSING_KEYS:${missingKeys.join(",")}`,
  };
};

export const getAllIntegrationRuntimeReports = () => {
  return connectorEnvSpecs.map((spec) => getIntegrationRuntimeReport(spec.key));
};

const getPreviewAggregate = (items: ShippingQuoteItemInput[]) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let subtotal = 0;

  for (const item of items) {
    const quantity = Math.max(asNumber(item.quantity, 1), 1);
    const weight = Math.max(asNumber(item.weight_kg, 0), 0);
    const volume = Math.max(asNumber(item.volume_m3, 0), 0);
    const unitPrice = Math.max(asNumber(item.unit_price, 0), 0);

    totalWeight += weight * quantity;
    totalVolume += volume * quantity;
    subtotal += unitPrice * quantity;
  }

  return {
    totalWeight,
    totalVolume,
    subtotal,
  };
};

export const buildShippingQuotePreview = (
  input: ShippingQuotePreviewInput
): ShippingQuotePreview[] => {
  const items = Array.isArray(input.items) ? input.items : [];
  const { totalWeight, totalVolume, subtotal } = getPreviewAggregate(items);

  const baseCost = 79;
  const weightCost = totalWeight * 2.6;
  const volumeCost = totalVolume * 700;
  const valueCost = subtotal * 0.005;
  const amount = Math.max(baseCost + weightCost + volumeCost + valueCost, 79);

  return [
    {
      carrier: "Fraktjakt",
      service: "Standard",
      amount: Math.round(amount),
      currency_code: "SEK",
      estimated_days: 3,
      mode: "simulated",
      note: "SKIP_MODE_PREVIEW",
    },
    {
      carrier: "Fraktjakt",
      service: "Express",
      amount: Math.round(amount * 1.45),
      currency_code: "SEK",
      estimated_days: 1,
      mode: "simulated",
      note: "SKIP_MODE_PREVIEW",
    },
  ];
};

export const buildKlarnaSessionPreview = (input: KlarnaSessionPreviewInput) => {
  const amount = Math.max(asNumber(input.amount, 0), 0);
  const currencyCode = String(input.currency_code || "SEK").toUpperCase();
  const orderReference = String(input.order_reference || `ord-prev-${Date.now()}`);

  return {
    provider: "klarna",
    status: "preview",
    client_token: `skip_preview_${orderReference}`,
    payment_session_id: `ps_skip_${Date.now()}`,
    amount,
    currency_code: currencyCode,
    locale: input.locale || "sv-SE",
    note: "SKIP_MODE_PREVIEW",
  };
};

export const buildFortnoxExportPreview = (input: FortnoxExportInput) => {
  return {
    integration: "fortnox",
    export_type: input.export_type || "orders",
    period_from: input.period_from || null,
    period_to: input.period_to || null,
    status: "queued_preview",
    note: "SKIP_MODE_PREVIEW",
  };
};
