type StrapiProductEnrichmentInput = Record<string, unknown>;

type StrapiRecord = {
  id?: string | number;
  documentId?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
};

type StrapiListResponse = {
  data?: StrapiRecord[];
};

type StrapiSingleResponse = {
  data?: StrapiRecord;
};

export type StrapiUpsertResult = {
  id?: string;
  documentId?: string;
};

type StrapiClientOptions = {
  baseUrl: string;
  token: string;
};

const ensure = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`[sync] ${key} is not configured`);
  }

  return value;
};

const normalizeBaseUrl = (value: string) => {
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const toId = (value: unknown) => {
  if (value == null) {
    return undefined;
  }

  return String(value);
};

const getRecordValue = (record: StrapiRecord, key: string) => {
  return record[key] ?? record.attributes?.[key];
};

class StrapiSyncClient {
  private baseUrl: string;
  private token: string;

  constructor(options: StrapiClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.token = options.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `[sync] Strapi request failed ${response.status} ${response.statusText}: ${body}`
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async findProductEnrichmentByMedusaId(medusaId: string) {
    const query = `/api/product-enrichments?filters[medusa_id][$eq]=${encodeURIComponent(
      medusaId
    )}&pagination[limit]=1`;
    const response = await this.request<StrapiListResponse>(query);

    return response.data?.[0];
  }

  async upsertProductEnrichmentByMedusaId(
    medusaId: string,
    data: StrapiProductEnrichmentInput
  ): Promise<StrapiUpsertResult> {
    const existing = await this.findProductEnrichmentByMedusaId(medusaId);
    const payload = JSON.stringify({ data });

    if (existing?.id != null) {
      const response = await this.request<StrapiSingleResponse>(
        `/api/product-enrichments/${existing.id}`,
        {
          method: "PUT",
          body: payload,
        }
      );
      const record = response.data || existing;

      return {
        id: toId(record.id),
        documentId: toId(getRecordValue(record, "documentId")),
      };
    }

    const response = await this.request<StrapiSingleResponse>(
      "/api/product-enrichments",
      {
        method: "POST",
        body: payload,
      }
    );
    const record = response.data;

    return {
      id: toId(record?.id),
      documentId: toId(getRecordValue(record || {}, "documentId")),
    };
  }
}

export const createStrapiSyncClientFromEnv = () => {
  return new StrapiSyncClient({
    baseUrl: ensure(process.env.STRAPI_URL, "STRAPI_URL"),
    token: ensure(process.env.STRAPI_API_TOKEN, "STRAPI_API_TOKEN"),
  });
};

export const isStrapiSyncConfigured = () => {
  return Boolean(process.env.STRAPI_URL && process.env.STRAPI_API_TOKEN);
};
