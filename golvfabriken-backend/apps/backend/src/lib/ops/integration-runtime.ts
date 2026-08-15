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
  shipment_type?: string;
  pallet_count?: number;
  loading_meters?: number;
  component_breakdown?:
    | Record<string, number>
    | Array<{
        key?: string;
        component?: string;
        quantity?: number;
      }>;
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

export type ShippingQuoteResolution = {
  mode: "live" | "simulated" | "skip";
  quotes: ShippingQuotePreview[];
  package_plan?: ShippingPackagePlan;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type ShippingPackagePlan = {
  total_items: number;
  total_quantity: number;
  total_weight_kg: number;
  total_volume_m3: number;
  total_pallet_count: number;
  total_loading_meters: number;
  shipment_types: string[];
  component_totals: Array<{
    key: string;
    quantity: number;
  }>;
};

export type ShippingBookingInput = {
  order_reference: string;
  quote_service?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  destination_country?: string;
  postal_code?: string;
  address_line1?: string;
  city?: string;
  items?: ShippingQuoteItemInput[];
};

export type ShippingBookingResolution = {
  mode: "live" | "simulated" | "skip";
  booking: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type ShippingLabelResolution = {
  mode: "live" | "simulated" | "skip";
  label: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type ShippingTrackingResolution = {
  mode: "live" | "simulated" | "skip";
  tracking: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type ShippingAddressValidationInput = {
  country_code?: string;
  postal_code?: string;
  city?: string;
  address_line1?: string;
  company?: string;
  recipient_name?: string;
  phone?: string;
};

export type ShippingAddressValidationResolution = {
  mode: "live" | "simulated" | "skip";
  validation: {
    is_valid: boolean;
    normalized_address: Record<string, unknown>;
    warnings: string[];
    source: "fraktjakt_live" | "simulation";
  };
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type KlarnaSessionPreviewInput = {
  amount: number;
  currency_code?: string;
  locale?: string;
  order_reference?: string;
};

export type KlarnaSessionResolution = {
  mode: "live" | "simulated" | "skip";
  session: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type KlarnaCreateOrderResolution = {
  mode: "live" | "simulated" | "skip";
  order: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type KlarnaCaptureResolution = {
  mode: "live" | "simulated" | "skip";
  capture: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
};

export type KlarnaRefundResolution = {
  mode: "live" | "simulated" | "skip";
  refund: Record<string, unknown>;
  note?: string;
  runtime: IntegrationRuntimeReport;
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

const asPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Math.floor(Number(value));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const trimTrailingSlash = (value: string) => {
  return value.replace(/\/+$/g, "");
};

const normalizePath = (value: string) => {
  if (value.startsWith("/")) {
    return value;
  }

  return `/${value}`;
};

const joinUrl = (baseUrl: string, endpointPath: string) => {
  return `${trimTrailingSlash(baseUrl)}${normalizePath(endpointPath)}`;
};

const applyPathParams = (
  pathTemplate: string,
  replacements: Record<string, string | number>
) => {
  let output = pathTemplate;

  for (const [key, value] of Object.entries(replacements)) {
    output = output.replace(new RegExp(`\\{${key}\\}`, "g"), encodeURIComponent(String(value)));
  }

  return output;
};

const withTimeout = async <T>(
  callback: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await callback(controller.signal);
  } finally {
    clearTimeout(timer);
  }
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

const normalizeComponentBreakdown = (
  value: ShippingQuoteItemInput["component_breakdown"],
  quantityMultiplier: number
) => {
  const entries: Array<{ key: string; quantity: number }> = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      const key = String(item?.key || item?.component || "").trim().toLowerCase();
      const quantity = Math.max(asNumber(item?.quantity, 0), 0);

      if (!key || quantity <= 0) {
        continue;
      }

      entries.push({
        key,
        quantity: quantity * quantityMultiplier,
      });
    }

    return entries;
  }

  if (value && typeof value === "object") {
    for (const [rawKey, rawQuantity] of Object.entries(value)) {
      const key = String(rawKey || "").trim().toLowerCase();
      const quantity = Math.max(asNumber(rawQuantity, 0), 0);

      if (!key || quantity <= 0) {
        continue;
      }

      entries.push({
        key,
        quantity: quantity * quantityMultiplier,
      });
    }
  }

  return entries;
};

export const buildShippingPackagePlan = (
  items: ShippingQuoteItemInput[] = []
): ShippingPackagePlan => {
  let totalQuantity = 0;
  let totalWeightKg = 0;
  let totalVolumeM3 = 0;
  let totalPalletCount = 0;
  let totalLoadingMeters = 0;
  const shipmentTypeSet = new Set<string>();
  const componentTotals = new Map<string, number>();

  for (const item of items) {
    const quantity = Math.max(asNumber(item.quantity, 1), 1);
    totalQuantity += quantity;
    totalWeightKg += Math.max(asNumber(item.weight_kg, 0), 0) * quantity;
    totalVolumeM3 += Math.max(asNumber(item.volume_m3, 0), 0) * quantity;
    totalPalletCount += Math.max(asNumber(item.pallet_count, 0), 0) * quantity;
    totalLoadingMeters += Math.max(asNumber(item.loading_meters, 0), 0) * quantity;

    const shipmentType = String(item.shipment_type || "").trim().toLowerCase();
    if (shipmentType) {
      shipmentTypeSet.add(shipmentType);
    }

    const componentEntries = normalizeComponentBreakdown(
      item.component_breakdown,
      quantity
    );
    for (const component of componentEntries) {
      componentTotals.set(
        component.key,
        (componentTotals.get(component.key) || 0) + component.quantity
      );
    }
  }

  return {
    total_items: items.length,
    total_quantity: totalQuantity,
    total_weight_kg: Number(totalWeightKg.toFixed(3)),
    total_volume_m3: Number(totalVolumeM3.toFixed(4)),
    total_pallet_count: Number(totalPalletCount.toFixed(3)),
    total_loading_meters: Number(totalLoadingMeters.toFixed(3)),
    shipment_types: Array.from(shipmentTypeSet),
    component_totals: Array.from(componentTotals.entries()).map(([key, quantity]) => ({
      key,
      quantity: Number(quantity.toFixed(3)),
    })),
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

const mapLiveFraktjaktQuotes = (
  payload: any,
  fallbackCurrencyCode?: string
): ShippingQuotePreview[] => {
  const candidates = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.quotes)
      ? payload.quotes
      : Array.isArray(payload?.rates)
        ? payload.rates
        : Array.isArray(payload?.services)
          ? payload.services
          : [];

  const mapped = candidates
    .map((item: any) => {
      const amount = asNumber(
        item?.amount ?? item?.price ?? item?.total_price ?? item?.cost ?? 0,
        0
      );
      const estimatedDays = asPositiveInt(
        item?.estimated_days ?? item?.delivery_days ?? item?.eta_days ?? 3,
        3
      );
      const carrier =
        String(item?.carrier || item?.carrier_name || "Fraktjakt").trim() || "Fraktjakt";
      const service =
        String(item?.service || item?.service_name || item?.name || "Standard").trim() ||
        "Standard";
      const currencyCode = String(
        item?.currency_code || item?.currency || fallbackCurrencyCode || "SEK"
      )
        .trim()
        .toUpperCase();

      if (!Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      return {
        carrier,
        service,
        amount: Math.round(amount),
        currency_code: currencyCode,
        estimated_days: estimatedDays,
        mode: "live" as const,
      };
    })
    .filter(Boolean);

  return mapped as ShippingQuotePreview[];
};

export const resolveShippingQuote = async (
  input: ShippingQuotePreviewInput & {
    currency_code?: string;
  },
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<ShippingQuoteResolution> => {
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        quotes: [],
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    const fallbackQuotes = buildShippingQuotePreview(input).map((quote) => ({
      ...quote,
      currency_code: String(input.currency_code || quote.currency_code).toUpperCase(),
    }));

    return {
      mode: "simulated",
      quotes: fallbackQuotes,
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPath = String(
    process.env.FRAKTJAKT_RATE_PATH || "/shipping/v1/quotes"
  ).trim();
  const timeoutMs = asPositiveInt(process.env.FRAKTJAKT_RATE_TIMEOUT_MS, 4000);
  const packagePlan = buildShippingPackagePlan(
    Array.isArray(input.items) ? input.items : []
  );
  const payload = {
    destination_country: input.destination_country || "SE",
    postal_code: input.postal_code || "",
    items: Array.isArray(input.items) ? input.items : [],
    currency_code: String(input.currency_code || "SEK").toUpperCase(),
    package_plan: packagePlan,
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(process.env.FRAKTJAKT_API_KEY || ""),
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`FRAKTJAKT_HTTP_${response.status}`);
    }

    const body = await response.json();
    const liveQuotes = mapLiveFraktjaktQuotes(body, payload.currency_code);

    if (!liveQuotes.length) {
      throw new Error("FRAKTJAKT_EMPTY_QUOTES");
    }

    return {
      mode: "live",
      quotes: liveQuotes,
      package_plan: packagePlan,
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        quotes: [],
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    const fallbackQuotes = buildShippingQuotePreview(input).map((quote) => ({
      ...quote,
      currency_code: String(input.currency_code || quote.currency_code).toUpperCase(),
      note: "LIVE_FALLBACK_TO_SIMULATION",
    }));

    return {
      mode: "simulated",
      quotes: fallbackQuotes,
      package_plan: packagePlan,
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveShippingBooking = async (
  input: ShippingBookingInput,
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<ShippingBookingResolution> => {
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();
  const packagePlan = buildShippingPackagePlan(
    Array.isArray(input.items) ? input.items : []
  );

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        booking: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      booking: {
        booking_id: `ship_sim_${Date.now()}`,
        shipment_id: `frakt_sim_${Date.now()}`,
        status: "booked_preview",
        order_reference: input.order_reference,
        package_plan: packagePlan,
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPath = String(
    process.env.FRAKTJAKT_BOOKING_PATH || "/shipping/v1/bookings"
  ).trim();
  const timeoutMs = asPositiveInt(process.env.FRAKTJAKT_BOOKING_TIMEOUT_MS, 5000);
  const payload = {
    order_reference: input.order_reference,
    quote_service: input.quote_service || "Standard",
    recipient: {
      name: input.recipient_name || "",
      email: input.recipient_email || "",
      phone: input.recipient_phone || "",
    },
    destination: {
      country: input.destination_country || "SE",
      postal_code: input.postal_code || "",
      address_line1: input.address_line1 || "",
      city: input.city || "",
    },
    items: Array.isArray(input.items) ? input.items : [],
    package_plan: packagePlan,
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(process.env.FRAKTJAKT_API_KEY || ""),
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`FRAKTJAKT_BOOKING_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    const shipmentId = body.shipment_id || body.id || body.booking_id;

    if (!shipmentId) {
      throw new Error("FRAKTJAKT_BOOKING_EMPTY_RESPONSE");
    }

    return {
      mode: "live",
      booking: {
        booking_id: body.booking_id || body.id || `book_${Date.now()}`,
        shipment_id: shipmentId,
        status: body.status || "booked",
        label_url: body.label_url || null,
        tracking_number: body.tracking_number || null,
        tracking_url: body.tracking_url || null,
        package_plan: packagePlan,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        booking: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      booking: {
        booking_id: `ship_sim_${Date.now()}`,
        shipment_id: `frakt_sim_${Date.now()}`,
        status: "booked_fallback_preview",
        order_reference: input.order_reference,
        package_plan: packagePlan,
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveShippingLabel = async (
  shipmentId: string,
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<ShippingLabelResolution> => {
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        label: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      label: {
        shipment_id: shipmentId,
        label_url: `https://example.local/labels/${encodeURIComponent(shipmentId)}.pdf`,
        mode: "simulated",
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPathTemplate = String(
    process.env.FRAKTJAKT_LABEL_PATH || "/shipping/v1/shipments/{shipment_id}/label"
  ).trim();
  const endpointPath = applyPathParams(endpointPathTemplate, {
    shipment_id: shipmentId,
  });
  const timeoutMs = asPositiveInt(process.env.FRAKTJAKT_LABEL_TIMEOUT_MS, 5000);

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(process.env.FRAKTJAKT_API_KEY || ""),
        },
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`FRAKTJAKT_LABEL_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;

    return {
      mode: "live",
      label: {
        shipment_id: shipmentId,
        label_url: body.label_url || body.url || body.pdf_url || null,
        label_id: body.label_id || body.id || null,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        label: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      label: {
        shipment_id: shipmentId,
        label_url: `https://example.local/labels/${encodeURIComponent(shipmentId)}.pdf`,
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveShippingTracking = async (
  shipmentId: string,
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<ShippingTrackingResolution> => {
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        tracking: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      tracking: {
        shipment_id: shipmentId,
        tracking_number: `TRK-SIM-${Date.now()}`,
        status: "in_transit",
        events: [
          {
            status: "created",
            timestamp: new Date().toISOString(),
            location: "Warehouse",
          },
        ],
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPathTemplate = String(
    process.env.FRAKTJAKT_TRACKING_PATH || "/shipping/v1/shipments/{shipment_id}/tracking"
  ).trim();
  const endpointPath = applyPathParams(endpointPathTemplate, {
    shipment_id: shipmentId,
  });
  const timeoutMs = asPositiveInt(process.env.FRAKTJAKT_TRACKING_TIMEOUT_MS, 4000);

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "GET",
        headers: {
          "x-api-key": String(process.env.FRAKTJAKT_API_KEY || ""),
        },
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`FRAKTJAKT_TRACKING_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;

    return {
      mode: "live",
      tracking: {
        shipment_id: shipmentId,
        tracking_number: body.tracking_number || body.number || null,
        tracking_url: body.tracking_url || body.url || null,
        status: body.status || "unknown",
        events: Array.isArray(body.events) ? body.events : [],
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        tracking: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      tracking: {
        shipment_id: shipmentId,
        tracking_number: `TRK-SIM-${Date.now()}`,
        status: "in_transit",
        events: [
          {
            status: "created",
            timestamp: new Date().toISOString(),
            location: "Warehouse",
          },
        ],
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveShippingAddressValidation = async (
  input: ShippingAddressValidationInput,
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<ShippingAddressValidationResolution> => {
  const runtime = getIntegrationRuntimeReport("fraktjakt");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();
  const simulatedValidation = {
    is_valid: true,
    normalized_address: {
      country_code: String(input.country_code || "SE").toUpperCase(),
      postal_code: String(input.postal_code || "").trim(),
      city: String(input.city || "").trim(),
      address_line1: String(input.address_line1 || "").trim(),
      company: String(input.company || "").trim() || null,
      recipient_name: String(input.recipient_name || "").trim() || null,
      phone: String(input.phone || "").trim() || null,
    },
    warnings: [] as string[],
    source: "simulation" as const,
  };

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        validation: {
          ...simulatedValidation,
          is_valid: false,
          warnings: ["SKIP_MISSING_KEYS"],
        },
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      validation: simulatedValidation,
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPath = String(
    process.env.FRAKTJAKT_ADDRESS_VALIDATE_PATH || "/shipping/v1/address/validate"
  ).trim();
  const timeoutMs = asPositiveInt(
    process.env.FRAKTJAKT_ADDRESS_VALIDATE_TIMEOUT_MS,
    3000
  );
  const payload = {
    country_code: String(input.country_code || "SE").toUpperCase(),
    postal_code: String(input.postal_code || "").trim(),
    city: String(input.city || "").trim(),
    address_line1: String(input.address_line1 || "").trim(),
    company: String(input.company || "").trim() || undefined,
    recipient_name: String(input.recipient_name || "").trim() || undefined,
    phone: String(input.phone || "").trim() || undefined,
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(process.env.FRAKTJAKT_API_KEY || ""),
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`FRAKTJAKT_ADDRESS_VALIDATE_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    const isValidCandidate =
      body.is_valid ??
      body.valid ??
      (body.status === "valid" ? true : undefined) ??
      (body.result === "valid" ? true : undefined) ??
      false;
    const isValid = Boolean(isValidCandidate);

    return {
      mode: "live",
      validation: {
        is_valid: isValid,
        normalized_address:
          (body.normalized_address as Record<string, unknown>) ||
          (body.address as Record<string, unknown>) ||
          payload,
        warnings: Array.isArray(body.warnings)
          ? body.warnings.map((item) => String(item))
          : [],
        source: "fraktjakt_live",
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        validation: {
          ...simulatedValidation,
          is_valid: false,
          warnings: [
            `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      validation: {
        ...simulatedValidation,
        warnings: [
          `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
        ],
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
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

export const resolveKlarnaSession = async (
  input: KlarnaSessionPreviewInput,
  options: {
    allowSimulationFallback?: boolean;
    purchase_country?: string;
  } = {}
): Promise<KlarnaSessionResolution> => {
  const runtime = getIntegrationRuntimeReport("klarna");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        session: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      session: buildKlarnaSessionPreview(input),
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointPath = String(process.env.KLARNA_SESSION_PATH || "/payments/v1/sessions").trim();
  const timeoutMs = asPositiveInt(process.env.KLARNA_SESSION_TIMEOUT_MS, 5000);
  const locale = input.locale || "sv-SE";
  const purchaseCountry = String(options.purchase_country || "SE").toUpperCase();
  const purchaseCurrency = String(input.currency_code || "SEK").toUpperCase();
  const authHeader = Buffer.from(
    `${String(process.env.KLARNA_USERNAME || "")}:${String(process.env.KLARNA_PASSWORD || "")}`
  ).toString("base64");
  const requestPayload = {
    purchase_country: purchaseCountry,
    purchase_currency: purchaseCurrency,
    locale,
    order_amount: Math.round(Math.max(asNumber(input.amount, 0), 0) * 100),
    order_tax_amount: 0,
    order_lines: [
      {
        type: "physical",
        reference: String(input.order_reference || `ord-${Date.now()}`),
        name: "Order",
        quantity: 1,
        unit_price: Math.round(Math.max(asNumber(input.amount, 0), 0) * 100),
        tax_rate: 0,
        total_amount: Math.round(Math.max(asNumber(input.amount, 0), 0) * 100),
        total_tax_amount: 0,
      },
    ],
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(requestPayload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`KLARNA_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;

    if (!body || !body.client_token) {
      throw new Error("KLARNA_EMPTY_SESSION");
    }

    return {
      mode: "live",
      session: {
        provider: "klarna",
        status: "live",
        client_token: body.client_token,
        payment_session_id:
          body.session_id || body.payment_session_id || `ps_live_${Date.now()}`,
        amount: input.amount,
        currency_code: purchaseCurrency,
        locale,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        session: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      session: {
        ...buildKlarnaSessionPreview(input),
        note: "LIVE_FALLBACK_TO_SIMULATION",
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveKlarnaCreateOrder = async (
  input: {
    authorization_token: string;
    order_reference?: string;
    amount: number;
    currency_code?: string;
    purchase_country?: string;
    locale?: string;
  },
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<KlarnaCreateOrderResolution> => {
  const runtime = getIntegrationRuntimeReport("klarna");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        order: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      order: {
        order_id: `kord_sim_${Date.now()}`,
        status: "created_preview",
        order_reference: input.order_reference || null,
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointTemplate = String(
    process.env.KLARNA_ORDER_CREATE_PATH || "/payments/v1/authorizations/{authorization_token}/order"
  ).trim();
  const endpointPath = applyPathParams(endpointTemplate, {
    authorization_token: input.authorization_token,
  });
  const timeoutMs = asPositiveInt(process.env.KLARNA_ORDER_TIMEOUT_MS, 6000);
  const purchaseCountry = String(input.purchase_country || "SE").toUpperCase();
  const purchaseCurrency = String(input.currency_code || "SEK").toUpperCase();
  const authHeader = Buffer.from(
    `${String(process.env.KLARNA_USERNAME || "")}:${String(process.env.KLARNA_PASSWORD || "")}`
  ).toString("base64");
  const orderAmountMinor = Math.round(Math.max(asNumber(input.amount, 0), 0) * 100);
  const payload = {
    purchase_country: purchaseCountry,
    purchase_currency: purchaseCurrency,
    locale: input.locale || "sv-SE",
    order_amount: orderAmountMinor,
    order_tax_amount: 0,
    merchant_reference1: input.order_reference || null,
    order_lines: [
      {
        type: "physical",
        reference: String(input.order_reference || `ord-${Date.now()}`),
        name: "Order",
        quantity: 1,
        unit_price: orderAmountMinor,
        tax_rate: 0,
        total_amount: orderAmountMinor,
        total_tax_amount: 0,
      },
    ],
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`KLARNA_ORDER_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    const orderId = body.order_id || body.id;

    if (!orderId) {
      throw new Error("KLARNA_ORDER_EMPTY");
    }

    return {
      mode: "live",
      order: {
        order_id: orderId,
        fraud_status: body.fraud_status || null,
        redirect_url: body.redirect_url || null,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        order: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      order: {
        order_id: `kord_sim_${Date.now()}`,
        status: "created_fallback_preview",
        order_reference: input.order_reference || null,
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveKlarnaCapture = async (
  input: {
    order_id: string;
    captured_amount?: number;
    description?: string;
    order_lines?: Array<Record<string, unknown>>;
  },
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<KlarnaCaptureResolution> => {
  const runtime = getIntegrationRuntimeReport("klarna");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        capture: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      capture: {
        order_id: input.order_id,
        capture_id: `kcap_sim_${Date.now()}`,
        status: "captured_preview",
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointTemplate = String(
    process.env.KLARNA_CAPTURE_PATH || "/ordermanagement/v1/orders/{order_id}/captures"
  ).trim();
  const endpointPath = applyPathParams(endpointTemplate, {
    order_id: input.order_id,
  });
  const timeoutMs = asPositiveInt(process.env.KLARNA_CAPTURE_TIMEOUT_MS, 6000);
  const authHeader = Buffer.from(
    `${String(process.env.KLARNA_USERNAME || "")}:${String(process.env.KLARNA_PASSWORD || "")}`
  ).toString("base64");
  const payload = {
    captured_amount:
      input.captured_amount === undefined
        ? undefined
        : Math.round(Math.max(asNumber(input.captured_amount, 0), 0) * 100),
    description: input.description,
    order_lines: input.order_lines,
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`KLARNA_CAPTURE_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;

    return {
      mode: "live",
      capture: {
        order_id: input.order_id,
        capture_id: body.capture_id || body.id || null,
        status: "captured",
        body,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        capture: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      capture: {
        order_id: input.order_id,
        capture_id: `kcap_sim_${Date.now()}`,
        status: "captured_fallback_preview",
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
};

export const resolveKlarnaRefund = async (
  input: {
    order_id: string;
    refunded_amount: number;
    description?: string;
  },
  options: {
    allowSimulationFallback?: boolean;
  } = {}
): Promise<KlarnaRefundResolution> => {
  const runtime = getIntegrationRuntimeReport("klarna");
  const allowSimulationFallback = options.allowSimulationFallback !== false;
  const simulationEnabled = isOpsIntegrationSimulationEnabled();

  if (!runtime.ready) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        refund: {},
        note: runtime.skipReason || "SKIP_MISSING_KEYS",
        runtime,
      };
    }

    return {
      mode: "simulated",
      refund: {
        order_id: input.order_id,
        refund_id: `krfd_sim_${Date.now()}`,
        status: "refunded_preview",
      },
      note: runtime.skipReason || "SKIP_MODE_PREVIEW",
      runtime,
    };
  }

  const endpointTemplate = String(
    process.env.KLARNA_REFUND_PATH || "/ordermanagement/v1/orders/{order_id}/refunds"
  ).trim();
  const endpointPath = applyPathParams(endpointTemplate, {
    order_id: input.order_id,
  });
  const timeoutMs = asPositiveInt(process.env.KLARNA_REFUND_TIMEOUT_MS, 6000);
  const authHeader = Buffer.from(
    `${String(process.env.KLARNA_USERNAME || "")}:${String(process.env.KLARNA_PASSWORD || "")}`
  ).toString("base64");
  const payload = {
    refunded_amount: Math.round(Math.max(asNumber(input.refunded_amount, 0), 0) * 100),
    description: input.description,
  };

  try {
    const response = await withTimeout(async (signal) => {
      const requestUrl = joinUrl(String(runtime.baseUrl || ""), endpointPath);
      return fetch(requestUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`KLARNA_REFUND_HTTP_${response.status}`);
    }

    const body = (await response.json()) as Record<string, unknown>;

    return {
      mode: "live",
      refund: {
        order_id: input.order_id,
        refund_id: body.refund_id || body.id || null,
        status: "refunded",
        body,
      },
      runtime,
    };
  } catch (error) {
    if (!allowSimulationFallback || !simulationEnabled) {
      return {
        mode: "skip",
        refund: {},
        note: `LIVE_ERROR:${error instanceof Error ? error.message : String(error)}`,
        runtime,
      };
    }

    return {
      mode: "simulated",
      refund: {
        order_id: input.order_id,
        refund_id: `krfd_sim_${Date.now()}`,
        status: "refunded_fallback_preview",
      },
      note: `LIVE_FALLBACK:${error instanceof Error ? error.message : String(error)}`,
      runtime,
    };
  }
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
