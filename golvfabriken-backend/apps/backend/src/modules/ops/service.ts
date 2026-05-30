import { MedusaService } from "@medusajs/framework/utils";
import ComplaintCase from "./models/complaint-case";
import ImportJob from "./models/import-job";
import IntegrationConnector from "./models/integration-connector";
import ReturnRequestCase from "./models/return-request-case";
import TaxConfiguration from "./models/tax-configuration";
import {
  buildFortnoxExportPreview,
  getAllIntegrationRuntimeReports,
  getIntegrationRuntimeReport,
} from "../../lib/ops/integration-runtime";
import {
  parseCsvContent,
  validateProductCatalogCsv,
  type CsvParseOptions,
} from "../../lib/ops/csv-import";
import {
  buildTaxQuote,
  pickBestTaxConfiguration,
  type TaxQuoteInput,
} from "../../lib/ops/tax-runtime";
import path from "path";
import fs from "fs/promises";

type GeneratedOpsModuleService = {
  listComplaintCases: (filters?: any, config?: any) => Promise<any[]>;
  createComplaintCases: (data: any) => Promise<any>;
  updateComplaintCases: (data: any) => Promise<any[]>;
  listReturnRequestCases: (filters?: any, config?: any) => Promise<any[]>;
  createReturnRequestCases: (data: any) => Promise<any>;
  updateReturnRequestCases: (data: any) => Promise<any[]>;
  listTaxConfigurations: (filters?: any, config?: any) => Promise<any[]>;
  createTaxConfigurations: (data: any) => Promise<any>;
  updateTaxConfigurations: (data: any) => Promise<any[]>;
  listImportJobs: (filters?: any, config?: any) => Promise<any[]>;
  createImportJobs: (data: any) => Promise<any>;
  updateImportJobs: (data: any) => Promise<any[]>;
  listIntegrationConnectors: (filters?: any, config?: any) => Promise<any[]>;
  createIntegrationConnectors: (data: any) => Promise<any>;
  updateIntegrationConnectors: (data: any) => Promise<any[]>;
};

type ComplaintType =
  | "complaint"
  | "damage"
  | "delivery_issue"
  | "quality_issue"
  | "billing_issue"
  | "other";

type ComplaintStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "rejected"
  | "closed";

type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "refunded"
  | "closed";

type IntegrationStatus = "planned" | "active" | "paused" | "error" | "skipped";

type IntegrationHealthCheckResult = {
  key: string;
  ready: boolean;
  status: IntegrationStatus;
  mode: "live" | "skip";
  missingKeys: string[];
  skipReason?: string;
};

type CsvValidationSource =
  | {
      csvContent: string;
      sourceLabel?: string;
    }
  | {
      filePath: string;
      sourceLabel?: string;
    };

const withoutUndefined = <T extends Record<string, unknown>>(input: T) => {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

const normalizeReference = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const isResolvedComplaintStatus = (status: ComplaintStatus) => {
  return status === "resolved" || status === "closed";
};

const complaintTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  open: ["investigating", "rejected", "closed"],
  investigating: ["resolved", "rejected", "closed"],
  resolved: ["closed"],
  rejected: ["closed"],
  closed: [],
};

const returnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected", "closed"],
  approved: ["received", "closed"],
  rejected: ["closed"],
  received: ["refunded", "closed"],
  refunded: ["closed"],
  closed: [],
};

const toDate = (value?: string | Date | null) => {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeDelimiter = (value?: string) => {
  if (value === ";" || value === "\t") {
    return value;
  }

  return ",";
};

const toImportIssueIndex = (csvRow?: number | null) => {
  const numeric = Number(csvRow);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric - 1;
};

class OpsModuleService extends MedusaService({
  ComplaintCase,
  ReturnRequestCase,
  TaxConfiguration,
  ImportJob,
  IntegrationConnector,
}) {
  async createComplaintCase(input: {
    orderId?: string;
    customerId?: string;
    customerEmail?: string;
    summary: string;
    description?: string;
    type?: ComplaintType;
    channel?: "storefront" | "admin" | "support";
    priority?: "low" | "medium" | "high" | "critical";
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;

    return generated.createComplaintCases(
      withoutUndefined({
        reference: normalizeReference("CMP"),
        order_id: input.orderId,
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        summary: input.summary,
        description: input.description,
        type: input.type || "complaint",
        channel: input.channel || "storefront",
        priority: input.priority || "medium",
        status: "open",
        metadata: input.metadata,
      })
    );
  }

  async getComplaintCases({
    status,
    limit = 100,
  }: {
    status?: ComplaintStatus;
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 100, 500), 1);
    const items = await generated.listComplaintCases(
      withoutUndefined({
        status,
      }),
      { take: take * 2 }
    );

    return items
      .sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, take);
  }

  async updateComplaintCaseStatus({
    id,
    status,
    resolution,
  }: {
    id: string;
    status: ComplaintStatus;
    resolution?: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const existing = await generated.listComplaintCases(
      {
        id,
      },
      { take: 1 }
    );
    const current = existing[0];

    if (!current) {
      throw new Error("Complaint case not found");
    }

    const currentStatus = String(current.status || "open") as ComplaintStatus;
    const allowed = complaintTransitions[currentStatus] || [];

    if (currentStatus !== status && !allowed.includes(status)) {
      throw new Error(
        `Invalid complaint status transition: ${currentStatus} -> ${status}`
      );
    }

    const [updated] = await generated.updateComplaintCases({
      selector: {
        id,
      },
      data: withoutUndefined({
        status,
        resolution,
        resolved_at: isResolvedComplaintStatus(status) ? new Date() : null,
      }),
    });

    return updated;
  }

  async createReturnRequestCase(input: {
    orderId: string;
    complaintCaseId?: string;
    customerId?: string;
    customerEmail?: string;
    reason?: "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;

    return generated.createReturnRequestCases(
      withoutUndefined({
        order_id: input.orderId,
        complaint_case_id: input.complaintCaseId,
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        reason: input.reason || "other",
        notes: input.notes,
        status: "requested",
        requested_at: new Date(),
        metadata: input.metadata,
      })
    );
  }

  async getReturnRequestCases({
    status,
    limit = 100,
  }: {
    status?: ReturnStatus;
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 100, 500), 1);
    const items = await generated.listReturnRequestCases(
      withoutUndefined({
        status,
      }),
      { take: take * 2 }
    );

    return items
      .sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, take);
  }

  async updateReturnRequestCaseStatus({
    id,
    status,
    notes,
  }: {
    id: string;
    status: ReturnStatus;
    notes?: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const existing = await generated.listReturnRequestCases(
      {
        id,
      },
      { take: 1 }
    );
    const current = existing[0];

    if (!current) {
      throw new Error("Return request case not found");
    }

    const currentStatus = String(current.status || "requested") as ReturnStatus;
    const allowed = returnTransitions[currentStatus] || [];

    if (currentStatus !== status && !allowed.includes(status)) {
      throw new Error(`Invalid return status transition: ${currentStatus} -> ${status}`);
    }

    const now = new Date();
    const [updated] = await generated.updateReturnRequestCases({
      selector: {
        id,
      },
      data: withoutUndefined({
        status,
        notes,
        approved_at: status === "approved" ? now : undefined,
        rejected_at: status === "rejected" ? now : undefined,
        received_at: status === "received" ? now : undefined,
        refunded_at: status === "refunded" ? now : undefined,
      }),
    });

    return updated;
  }

  async upsertTaxConfiguration(input: {
    countryCode: string;
    regionCode?: string;
    currencyCode?: string;
    vatRate?: number;
    isTaxInclusive?: boolean;
    euOssEnabled?: boolean;
    reverseChargeEnabled?: boolean;
    status?: "draft" | "active" | "archived";
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const countryCode = String(input.countryCode || "").trim().toLowerCase();
    const regionCode = String(input.regionCode || "").trim().toLowerCase() || undefined;
    const existing = await generated.listTaxConfigurations(
      {
        country_code: countryCode,
        region_code: regionCode || null,
      },
      { take: 1 }
    );
    const data = withoutUndefined({
      country_code: countryCode,
      region_code: regionCode,
      currency_code: input.currencyCode,
      vat_rate: input.vatRate,
      is_tax_inclusive: input.isTaxInclusive ?? false,
      eu_oss_enabled: input.euOssEnabled ?? false,
      reverse_charge_enabled: input.reverseChargeEnabled ?? false,
      status: input.status || "draft",
      notes: input.notes,
      metadata: input.metadata,
    });

    if (!existing[0]) {
      return generated.createTaxConfigurations(data);
    }

    const [updated] = await generated.updateTaxConfigurations({
      selector: {
        id: existing[0].id,
      },
      data,
    });

    return updated;
  }

  async getTaxConfigurations({
    status,
    countryCode,
    limit = 200,
  }: {
    status?: "draft" | "active" | "archived";
    countryCode?: string;
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 200, 500), 1);
    const items = await generated.listTaxConfigurations(
      withoutUndefined({
        status,
        country_code: countryCode ? String(countryCode).trim().toLowerCase() : undefined,
      }),
      { take: take * 2 }
    );

    return items
      .sort((a, b) => {
        return new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, take);
  }

  async calculateTaxQuotePreview(input: TaxQuoteInput) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const destinationCountry = String(input.destination_country || "")
      .trim()
      .toLowerCase();
    const configs = await generated.listTaxConfigurations(
      {
        country_code: destinationCountry,
      },
      { take: 100 }
    );
    const matched = pickBestTaxConfiguration({
      destinationCountry: input.destination_country,
      destinationRegion: input.destination_region,
      configurations: configs as any[],
    });

    return buildTaxQuote({
      input,
      matchedConfiguration: matched as any,
    });
  }

  async createImportJob(input: {
    jobType?:
      | "product_catalog"
      | "price_list"
      | "inventory"
      | "customer"
      | "order"
      | "other";
    source?: "csv" | "xlsx" | "api" | "manual";
    requestedBy?: string;
    fileName?: string;
    filePath?: string;
    metadata?: Record<string, unknown>;
    status?: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;

    return generated.createImportJobs(
      withoutUndefined({
        job_type: input.jobType || "product_catalog",
        source: input.source || "csv",
        requested_by: input.requestedBy,
        file_name: input.fileName,
        file_path: input.filePath,
        status: input.status || "queued",
        started_at: input.status === "running" ? new Date() : null,
        metadata: input.metadata,
      })
    );
  }

  async updateImportJobStatus({
    id,
    status,
    processedCount,
    failedCount,
    errorReport,
    startedAt,
    finishedAt,
  }: {
    id: string;
    status: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
    processedCount?: number;
    failedCount?: number;
    errorReport?: string;
    startedAt?: string | Date | null;
    finishedAt?: string | Date | null;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const [updated] = await generated.updateImportJobs({
      selector: {
        id,
      },
      data: withoutUndefined({
        status,
        processed_count: processedCount,
        failed_count: failedCount,
        error_report: errorReport,
        started_at: toDate(startedAt) || (status === "running" ? new Date() : undefined),
        finished_at:
          toDate(finishedAt) ||
          (status === "completed" ||
          status === "completed_with_errors" ||
          status === "failed" ||
          status === "skipped"
            ? new Date()
            : undefined),
      }),
    });

    return updated;
  }

  async getImportJobs({
    status,
    limit = 100,
  }: {
    status?: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 100, 500), 1);
    const items = await generated.listImportJobs(
      withoutUndefined({
        status,
      }),
      { take: take * 2 }
    );

    return items
      .sort((a, b) => {
        return new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, take);
  }

  async getImportJobById(id: string) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const items = await generated.listImportJobs(
      {
        id: String(id || "").trim(),
      },
      { take: 1 }
    );

    return items[0] || null;
  }

  async executeProductCatalogImport(input: {
    requestedBy?: string;
    filePath?: string;
    csvContent?: string;
    delimiter?: string;
    sourceLabel?: string;
    applyMode?: "dry_run" | "validate_and_stage";
    maxPreviewRows?: number;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const applyMode = input.applyMode || "dry_run";
    const maxPreviewRows = Math.max(Math.min(Number(input.maxPreviewRows) || 25, 200), 1);
    const sourceFilePath = input.filePath ? path.resolve(input.filePath) : undefined;
    const sourceCsv = String(input.csvContent || "");
    const hasSource = Boolean(sourceFilePath || sourceCsv.trim().length > 0);

    if (!hasSource) {
      throw new Error("csv_content or file_path is required");
    }

    const job = await this.createImportJob({
      jobType: "product_catalog",
      source: sourceFilePath ? "manual" : "api",
      requestedBy: input.requestedBy,
      fileName: sourceFilePath ? path.basename(sourceFilePath) : undefined,
      filePath: sourceFilePath,
      status: "running",
      metadata: {
        workflow: "product_catalog_import_execution",
        mode: applyMode,
        source: input.sourceLabel || (sourceFilePath || "inline_content"),
      },
    });

    try {
      const validationResult = await this.validateProductCatalogImport(
        sourceFilePath
          ? {
              filePath: sourceFilePath,
              sourceLabel: input.sourceLabel,
            }
          : {
              csvContent: sourceCsv,
              sourceLabel: input.sourceLabel,
            },
        {
          delimiter: normalizeDelimiter(input.delimiter) as "," | ";" | "\t",
        }
      );
      const parsedRows = parseCsvContent(
        sourceFilePath
          ? await fs.readFile(sourceFilePath, "utf-8")
          : sourceCsv,
        {
          delimiter: normalizeDelimiter(input.delimiter) as "," | ";" | "\t",
          trimValues: true,
        }
      ).rows;
      const invalidRowIndexes = new Set<number>();

      for (const issue of validationResult.validation.issues) {
        const issueIndex = toImportIssueIndex(issue.row);

        if (issueIndex !== null) {
          invalidRowIndexes.add(issueIndex);
        }
      }

      const acceptedRows = parsedRows.filter((_, index) => !invalidRowIndexes.has(index));
      const previewRows = acceptedRows.slice(0, maxPreviewRows);
      const finalStatus =
        validationResult.validation.invalidRows > 0
          ? "completed_with_errors"
          : "completed";
      const errorReport =
        finalStatus === "completed_with_errors"
          ? "IMPORT_COMPLETED_WITH_VALIDATION_ERRORS"
          : undefined;
      const [updatedWithMetadata] = await generated.updateImportJobs({
        selector: {
          id: job.id,
        },
        data: {
          metadata: {
            ...(job.metadata || {}),
            parser: validationResult.parser,
            parsed: validationResult.parsed,
            validation: validationResult.validation,
            source: validationResult.source,
            staged_rows: previewRows,
            staged_row_count: acceptedRows.length,
            preview_row_count: previewRows.length,
          },
        },
      });

      const updatedStatus = await this.updateImportJobStatus({
        id: updatedWithMetadata.id,
        status: finalStatus,
        processedCount: acceptedRows.length,
        failedCount: validationResult.validation.invalidRows,
        errorReport,
        startedAt: job.started_at || new Date(),
        finishedAt: new Date(),
      });

      return {
        job: updatedStatus,
        import: {
          mode: applyMode,
          source: validationResult.source,
          validation: validationResult.validation,
          staged_rows: previewRows,
          staged_row_count: acceptedRows.length,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.updateImportJobStatus({
        id: job.id,
        status: "failed",
        processedCount: 0,
        failedCount: 0,
        errorReport: message,
        startedAt: job.started_at || new Date(),
        finishedAt: new Date(),
      });
      throw error;
    }
  }

  async getProductCatalogImportReport({
    jobId,
  }: {
    jobId: string;
  }) {
    const job = await this.getImportJobById(jobId);

    if (!job) {
      return null;
    }

    const metadata = (job.metadata || {}) as Record<string, unknown>;
    const workflow = String(metadata.workflow || "");

    if (
      workflow !== "product_catalog_import_execution" &&
      workflow !== "product_catalog_validation"
    ) {
      return null;
    }

    return {
      job,
      report: {
        mode: metadata.mode || "validation",
        source: metadata.source || null,
        parser: metadata.parser || null,
        parsed: metadata.parsed || null,
        validation: metadata.validation || null,
        staged_rows: metadata.staged_rows || [],
        staged_row_count: metadata.staged_row_count || 0,
      },
    };
  }

  async registerIntegrationConnector(input: {
    key: string;
    displayName: string;
    category?: "shipping" | "payment" | "accounting" | "erp" | "cms" | "analytics" | "other";
    status?: IntegrationStatus;
    skipReason?: string;
    baseUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const normalizedKey = String(input.key || "")
      .trim()
      .toLowerCase();
    const existing = await generated.listIntegrationConnectors(
      {
        key: normalizedKey,
      },
      { take: 1 }
    );
    const data = withoutUndefined({
      key: normalizedKey,
      display_name: input.displayName,
      category: input.category || "other",
      status: input.status || "planned",
      skip_reason: input.skipReason,
      base_url: input.baseUrl,
      metadata: input.metadata,
    });

    if (!existing[0]) {
      return generated.createIntegrationConnectors(data);
    }

    const [updated] = await generated.updateIntegrationConnectors({
      selector: {
        id: existing[0].id,
      },
      data,
    });

    return updated;
  }

  async setIntegrationConnectorStatus({
    key,
    status,
    skipReason,
    lastError,
    lastHealthCheckAt,
    baseUrl,
  }: {
    key: string;
    status: IntegrationStatus;
    skipReason?: string;
    lastError?: string;
    lastHealthCheckAt?: string | Date | null;
    baseUrl?: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const normalizedKey = String(key || "")
      .trim()
      .toLowerCase();
    const existing = await generated.listIntegrationConnectors(
      {
        key: normalizedKey,
      },
      { take: 1 }
    );

    if (!existing[0]) {
      return generated.createIntegrationConnectors({
        key: normalizedKey,
        display_name: normalizedKey,
        category: "other",
        status,
        skip_reason: skipReason,
        last_error: lastError,
        base_url: baseUrl,
        last_health_check_at: toDate(lastHealthCheckAt) || null,
      });
    }

    const [updated] = await generated.updateIntegrationConnectors({
      selector: {
        id: existing[0].id,
      },
      data: withoutUndefined({
        status,
        skip_reason: skipReason,
        last_error: lastError,
        base_url: baseUrl,
        last_health_check_at: toDate(lastHealthCheckAt),
      }),
    });

    return updated;
  }

  async getIntegrationConnectors({
    status,
    category,
    limit = 200,
  }: {
    status?: IntegrationStatus;
    category?: "shipping" | "payment" | "accounting" | "erp" | "cms" | "analytics" | "other";
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 200, 500), 1);
    const items = await generated.listIntegrationConnectors(
      withoutUndefined({
        status,
        category,
      }),
      { take: take * 2 }
    );

    return items
      .sort((a, b) => {
        return new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, take);
  }

  async runIntegrationHealthCheck({
    keys,
  }: {
    keys?: Array<"fraktjakt" | "klarna" | "fortnox">;
  } = {}) {
    const reports = keys?.length
      ? keys.map((key) => getIntegrationRuntimeReport(key))
      : getAllIntegrationRuntimeReports();
    const updated: IntegrationHealthCheckResult[] = [];

    for (const report of reports) {
      const status: IntegrationStatus = report.ready ? "active" : "skipped";
      await this.setIntegrationConnectorStatus({
        key: report.key,
        status,
        skipReason: report.ready ? undefined : report.skipReason,
        lastError: report.ready ? undefined : report.skipReason,
        baseUrl: report.baseUrl,
        lastHealthCheckAt: new Date(),
      });

      updated.push({
        key: report.key,
        ready: report.ready,
        status,
        mode: report.mode,
        missingKeys: report.missingKeys,
        skipReason: report.skipReason,
      });
    }

    return {
      checked: updated.length,
      connectors: updated,
    };
  }

  async createFortnoxExportJob({
    exportType = "orders",
    periodFrom,
    periodTo,
    requestedBy,
    trigger = "manual",
  }: {
    exportType?: "orders" | "returns" | "settlements";
    periodFrom?: string;
    periodTo?: string;
    requestedBy?: string;
    trigger?: "manual" | "scheduled";
  }) {
    const runtime = getIntegrationRuntimeReport("fortnox");
    const preview = buildFortnoxExportPreview({
      export_type: exportType,
      period_from: periodFrom,
      period_to: periodTo,
    });
    const status = runtime.ready ? "queued" : "skipped";
    const errorReport = runtime.ready
      ? undefined
      : runtime.skipReason || "SKIP_MISSING_KEYS";
    const job = await this.createImportJob({
      jobType: "other",
      source: "api",
      requestedBy,
      status,
      metadata: {
        integration_key: "fortnox",
        workflow: "accounting_export",
        export_type: exportType,
        period_from: periodFrom || null,
        period_to: periodTo || null,
        trigger,
        preview,
        runtime,
      },
    });

    if (errorReport) {
      await this.updateImportJobStatus({
        id: job.id,
        status: "skipped",
        errorReport,
        finishedAt: new Date(),
      });
    }

    await this.setIntegrationConnectorStatus({
      key: "fortnox",
      status: runtime.ready ? "active" : "skipped",
      skipReason: runtime.skipReason,
      lastError: runtime.skipReason,
      baseUrl: runtime.baseUrl,
      lastHealthCheckAt: new Date(),
    });

    return {
      job,
      runtime,
      preview,
    };
  }

  async getFortnoxExportJobs({
    limit = 100,
    status,
  }: {
    limit?: number;
    status?: "queued" | "running" | "completed" | "completed_with_errors" | "failed" | "skipped";
  } = {}) {
    const jobs = await this.getImportJobs({
      limit: Math.max(limit * 2, 100),
      status,
    });

    return jobs
      .filter((job) => {
        const metadata = (job.metadata || {}) as Record<string, unknown>;

        return (
          metadata.integration_key === "fortnox" &&
          metadata.workflow === "accounting_export"
        );
      })
      .slice(0, Math.max(limit, 1));
  }

  async validateProductCatalogImport(
    source: CsvValidationSource,
    options: CsvParseOptions = {}
  ) {
    const delimiter = normalizeDelimiter(options.delimiter as string);
    const resolvedOptions: CsvParseOptions = {
      delimiter: delimiter as "," | ";" | "\t",
      trimValues: options.trimValues !== false,
    };
    const csvContent =
      "csvContent" in source
        ? source.csvContent
        : await fs.readFile(path.resolve(source.filePath), "utf-8");
    const parsed = parseCsvContent(csvContent, resolvedOptions);
    const validation = validateProductCatalogCsv(parsed.rows, parsed.headers);

    return {
      source:
        source.sourceLabel ||
        ("filePath" in source ? path.resolve(source.filePath) : "inline_content"),
      parser: {
        delimiter,
        ignoredLineCount: parsed.ignoredLineCount,
        headerCount: parsed.headers.length,
      },
      parsed: {
        headers: parsed.headers,
        rowCount: parsed.rows.length,
      },
      validation,
    };
  }

  async createProductCatalogImportValidationJob({
    requestedBy,
    filePath,
    csvContent,
    delimiter,
    sourceLabel,
  }: {
    requestedBy?: string;
    filePath?: string;
    csvContent?: string;
    delimiter?: string;
    sourceLabel?: string;
  }) {
    const result = await this.validateProductCatalogImport(
      filePath
        ? {
            filePath,
            sourceLabel,
          }
        : {
            csvContent: String(csvContent || ""),
            sourceLabel,
          },
      {
        delimiter: normalizeDelimiter(delimiter) as "," | ";" | "\t",
      }
    );
    const hasErrors =
      result.validation.requiredHeadersMissing.length > 0 ||
      result.validation.issues.length > 0;
    const job = await this.createImportJob({
      jobType: "product_catalog",
      source: filePath ? "manual" : "api",
      requestedBy,
      fileName: filePath ? path.basename(filePath) : undefined,
      filePath: filePath ? path.resolve(filePath) : undefined,
      status: hasErrors ? "completed_with_errors" : "completed",
      metadata: {
        workflow: "product_catalog_validation",
        validation: result.validation,
        parser: result.parser,
        parsed: result.parsed,
        source: result.source,
      },
    });

    await this.updateImportJobStatus({
      id: job.id,
      status: hasErrors ? "completed_with_errors" : "completed",
      processedCount: result.validation.validRows,
      failedCount: result.validation.invalidRows,
      errorReport: hasErrors ? "VALIDATION_ERRORS_DETECTED" : undefined,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    return {
      job,
      validation: result,
    };
  }

  async getOpsDashboardSummary() {
    const generated = this as unknown as GeneratedOpsModuleService;
    const [complaints, returns, imports, integrations, taxConfigurations] =
      await Promise.all([
        generated.listComplaintCases({}, { take: 2000 }),
        generated.listReturnRequestCases({}, { take: 2000 }),
        generated.listImportJobs({}, { take: 2000 }),
        generated.listIntegrationConnectors({}, { take: 200 }),
        generated.listTaxConfigurations({}, { take: 500 }),
      ]);
    const integrationRuntime = getAllIntegrationRuntimeReports();
    const statusCount = (items: any[], field: string) => {
      const counts: Record<string, number> = {};

      for (const item of items) {
        const key = String(item[field] || "unknown");
        counts[key] = (counts[key] || 0) + 1;
      }

      return counts;
    };

    return {
      complaints: {
        total: complaints.length,
        byStatus: statusCount(complaints, "status"),
      },
      returns: {
        total: returns.length,
        byStatus: statusCount(returns, "status"),
      },
      imports: {
        total: imports.length,
        byStatus: statusCount(imports, "status"),
      },
      tax_configurations: {
        total: taxConfigurations.length,
        byStatus: statusCount(taxConfigurations, "status"),
      },
      integrations: {
        total: integrations.length,
        byStatus: statusCount(integrations, "status"),
        runtime: integrationRuntime,
      },
    };
  }

  async getStoreComplaintByReference({
    reference,
    customerEmail,
  }: {
    reference: string;
    customerEmail?: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const items = await generated.listComplaintCases(
      {
        reference: String(reference || "").trim(),
      },
      { take: 5 }
    );
    const complaint = items.find((item) => {
      if (!customerEmail) {
        return true;
      }

      return String(item.customer_email || "").toLowerCase() ===
        String(customerEmail || "").toLowerCase();
    });

    return complaint || null;
  }

  async getStoreReturnById({
    id,
    customerEmail,
  }: {
    id: string;
    customerEmail?: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const items = await generated.listReturnRequestCases(
      {
        id: String(id || "").trim(),
      },
      { take: 5 }
    );
    const returnCase = items.find((item) => {
      if (!customerEmail) {
        return true;
      }

      return String(item.customer_email || "").toLowerCase() ===
        String(customerEmail || "").toLowerCase();
    });

    return returnCase || null;
  }
}

export default OpsModuleService;
