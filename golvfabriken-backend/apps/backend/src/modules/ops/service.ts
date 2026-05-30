import { MedusaService } from "@medusajs/framework/utils";
import ComplaintCase from "./models/complaint-case";
import ImportJob from "./models/import-job";
import IntegrationConnector from "./models/integration-connector";
import AuditLog from "./models/audit-log";
import PrivacyRequest from "./models/privacy-request";
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
import {
  anonymizeEmail,
  anonymizeIdentifier,
  normalizeEmail,
} from "../../lib/ops/privacy-runtime";
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
  listAuditLogs: (filters?: any, config?: any) => Promise<any[]>;
  createAuditLogs: (data: any) => Promise<any>;
  updateAuditLogs: (data: any) => Promise<any[]>;
  listPrivacyRequests: (filters?: any, config?: any) => Promise<any[]>;
  createPrivacyRequests: (data: any) => Promise<any>;
  updatePrivacyRequests: (data: any) => Promise<any[]>;
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
type AuditActorType = "admin" | "system" | "storefront" | "integration";
type PrivacyRequestType = "data_export" | "anonymize" | "erasure";
type PrivacyRequestStatus =
  | "requested"
  | "in_progress"
  | "completed"
  | "rejected"
  | "skipped";

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
  AuditLog,
  PrivacyRequest,
}) {
  async logAuditEvent(input: {
    entityType: string;
    entityId?: string;
    action: string;
    actorType?: AuditActorType;
    actorId?: string;
    actorEmail?: string;
    source?: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;

    return generated.createAuditLogs(
      withoutUndefined({
        entity_type: String(input.entityType || "").trim().toLowerCase(),
        entity_id: input.entityId ? String(input.entityId).trim() : undefined,
        action: String(input.action || "").trim().toLowerCase(),
        actor_type: input.actorType || "system",
        actor_id: input.actorId,
        actor_email: normalizeEmail(input.actorEmail),
        source: input.source,
        before_state: input.beforeState || undefined,
        after_state: input.afterState || undefined,
        metadata: input.metadata,
      })
    );
  }

  async getAuditEvents({
    entityType,
    entityId,
    action,
    actorType,
    limit = 200,
  }: {
    entityType?: string;
    entityId?: string;
    action?: string;
    actorType?: AuditActorType;
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 200, 1000), 1);
    const items = await generated.listAuditLogs(
      withoutUndefined({
        entity_type: entityType ? String(entityType).trim().toLowerCase() : undefined,
        entity_id: entityId ? String(entityId).trim() : undefined,
        action: action ? String(action).trim().toLowerCase() : undefined,
        actor_type: actorType,
      }),
      {
        take: take * 2,
      }
    );

    return items
      .sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, take);
  }

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
    const created = await generated.createComplaintCases(
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

    await this.logAuditEvent({
      entityType: "complaint_case",
      entityId: created.id,
      action: "create",
      actorType: input.channel === "storefront" ? "storefront" : "admin",
      actorId: input.customerId,
      actorEmail: input.customerEmail,
      source: "ops.service.createComplaintCase",
      afterState: {
        reference: created.reference,
        status: created.status,
        type: created.type,
        priority: created.priority,
      },
      metadata: {
        order_id: input.orderId,
      },
    });

    return created;
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

    await this.logAuditEvent({
      entityType: "complaint_case",
      entityId: updated.id,
      action: "status_update",
      actorType: "admin",
      source: "ops.service.updateComplaintCaseStatus",
      beforeState: {
        status: current.status,
        resolution: current.resolution || null,
      },
      afterState: {
        status: updated.status,
        resolution: updated.resolution || null,
      },
      metadata: {
        previous_status: current.status,
        next_status: updated.status,
      },
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
    const created = await generated.createReturnRequestCases(
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

    await this.logAuditEvent({
      entityType: "return_request_case",
      entityId: created.id,
      action: "create",
      actorType: "storefront",
      actorId: input.customerId,
      actorEmail: input.customerEmail,
      source: "ops.service.createReturnRequestCase",
      afterState: {
        status: created.status,
        reason: created.reason,
      },
      metadata: {
        order_id: input.orderId,
        complaint_case_id: input.complaintCaseId || null,
      },
    });

    return created;
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

    await this.logAuditEvent({
      entityType: "return_request_case",
      entityId: updated.id,
      action: "status_update",
      actorType: "admin",
      source: "ops.service.updateReturnRequestCaseStatus",
      beforeState: {
        status: current.status,
        notes: current.notes || null,
      },
      afterState: {
        status: updated.status,
        notes: updated.notes || null,
      },
      metadata: {
        previous_status: current.status,
        next_status: updated.status,
      },
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
      const created = await generated.createTaxConfigurations(data);

      await this.logAuditEvent({
        entityType: "tax_configuration",
        entityId: created.id,
        action: "create",
        actorType: "admin",
        source: "ops.service.upsertTaxConfiguration",
        afterState: {
          country_code: created.country_code,
          region_code: created.region_code,
          vat_rate: created.vat_rate,
          status: created.status,
        },
      });

      return created;
    }

    const [updated] = await generated.updateTaxConfigurations({
      selector: {
        id: existing[0].id,
      },
      data,
    });

    await this.logAuditEvent({
      entityType: "tax_configuration",
      entityId: updated.id,
      action: "update",
      actorType: "admin",
      source: "ops.service.upsertTaxConfiguration",
      beforeState: {
        country_code: existing[0].country_code,
        region_code: existing[0].region_code,
        vat_rate: existing[0].vat_rate,
        status: existing[0].status,
      },
      afterState: {
        country_code: updated.country_code,
        region_code: updated.region_code,
        vat_rate: updated.vat_rate,
        status: updated.status,
      },
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
    const created = await generated.createImportJobs(
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

    await this.logAuditEvent({
      entityType: "import_job",
      entityId: created.id,
      action: "create",
      actorType: "admin",
      actorId: input.requestedBy,
      source: "ops.service.createImportJob",
      afterState: {
        job_type: created.job_type,
        source: created.source,
        status: created.status,
      },
      metadata: {
        file_name: created.file_name || null,
      },
    });

    return created;
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
    const existingItems = await generated.listImportJobs(
      {
        id,
      },
      { take: 1 }
    );
    const existing = existingItems[0];
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

    await this.logAuditEvent({
      entityType: "import_job",
      entityId: updated.id,
      action: "status_update",
      actorType: "system",
      source: "ops.service.updateImportJobStatus",
      beforeState: existing
        ? {
            status: existing.status,
            processed_count: existing.processed_count,
            failed_count: existing.failed_count,
          }
        : undefined,
      afterState: {
        status: updated.status,
        processed_count: updated.processed_count,
        failed_count: updated.failed_count,
      },
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
      const created = await generated.createIntegrationConnectors(data);

      await this.logAuditEvent({
        entityType: "integration_connector",
        entityId: created.id,
        action: "create",
        actorType: "admin",
        source: "ops.service.registerIntegrationConnector",
        afterState: {
          key: created.key,
          status: created.status,
          category: created.category,
        },
      });

      return created;
    }

    const [updated] = await generated.updateIntegrationConnectors({
      selector: {
        id: existing[0].id,
      },
      data,
    });

    await this.logAuditEvent({
      entityType: "integration_connector",
      entityId: updated.id,
      action: "update",
      actorType: "admin",
      source: "ops.service.registerIntegrationConnector",
      beforeState: {
        status: existing[0].status,
        skip_reason: existing[0].skip_reason || null,
        base_url: existing[0].base_url || null,
      },
      afterState: {
        status: updated.status,
        skip_reason: updated.skip_reason || null,
        base_url: updated.base_url || null,
      },
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
      const created = await generated.createIntegrationConnectors({
        key: normalizedKey,
        display_name: normalizedKey,
        category: "other",
        status,
        skip_reason: skipReason,
        last_error: lastError,
        base_url: baseUrl,
        last_health_check_at: toDate(lastHealthCheckAt) || null,
      });

      await this.logAuditEvent({
        entityType: "integration_connector",
        entityId: created.id,
        action: "status_update",
        actorType: "system",
        source: "ops.service.setIntegrationConnectorStatus",
        afterState: {
          key: created.key,
          status: created.status,
          skip_reason: created.skip_reason || null,
        },
      });

      return created;
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

    await this.logAuditEvent({
      entityType: "integration_connector",
      entityId: updated.id,
      action: "status_update",
      actorType: "system",
      source: "ops.service.setIntegrationConnectorStatus",
      beforeState: {
        status: existing[0].status,
        skip_reason: existing[0].skip_reason || null,
      },
      afterState: {
        status: updated.status,
        skip_reason: updated.skip_reason || null,
      },
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

  async createPrivacyRequest(input: {
    requestType?: PrivacyRequestType;
    customerId?: string;
    customerEmail?: string;
    requestedBy?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const created = await generated.createPrivacyRequests(
      withoutUndefined({
        request_type: input.requestType || "data_export",
        status: "requested",
        customer_id: input.customerId,
        customer_email: normalizeEmail(input.customerEmail),
        requested_by: input.requestedBy,
        notes: input.notes,
        metadata: input.metadata,
      })
    );

    await this.logAuditEvent({
      entityType: "privacy_request",
      entityId: created.id,
      action: "create",
      actorType: "admin",
      actorId: input.requestedBy,
      actorEmail: input.customerEmail,
      source: "ops.service.createPrivacyRequest",
      afterState: {
        request_type: created.request_type,
        status: created.status,
      },
    });

    return created;
  }

  async getPrivacyRequests({
    status,
    requestType,
    limit = 200,
  }: {
    status?: PrivacyRequestStatus;
    requestType?: PrivacyRequestType;
    limit?: number;
  } = {}) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const take = Math.max(Math.min(Number(limit) || 200, 500), 1);
    const items = await generated.listPrivacyRequests(
      withoutUndefined({
        status,
        request_type: requestType,
      }),
      {
        take: take * 2,
      }
    );

    return items
      .sort((a, b) => {
        return new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, take);
  }

  async updatePrivacyRequestStatus({
    id,
    status,
    resultSummary,
    payload,
  }: {
    id: string;
    status: PrivacyRequestStatus;
    resultSummary?: string;
    payload?: Record<string, unknown>;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const existing = await generated.listPrivacyRequests(
      {
        id: String(id || "").trim(),
      },
      { take: 1 }
    );
    const current = existing[0];

    if (!current) {
      throw new Error("Privacy request not found");
    }

    const [updated] = await generated.updatePrivacyRequests({
      selector: {
        id: current.id,
      },
      data: withoutUndefined({
        status,
        result_summary: resultSummary,
        payload,
        started_at: status === "in_progress" ? new Date() : undefined,
        completed_at:
          status === "completed" || status === "rejected" || status === "skipped"
            ? new Date()
            : undefined,
      }),
    });

    await this.logAuditEvent({
      entityType: "privacy_request",
      entityId: updated.id,
      action: "status_update",
      actorType: "admin",
      source: "ops.service.updatePrivacyRequestStatus",
      beforeState: {
        status: current.status,
      },
      afterState: {
        status: updated.status,
        result_summary: updated.result_summary || null,
      },
    });

    return updated;
  }

  async runPrivacyExport({
    id,
  }: {
    id: string;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const requests = await generated.listPrivacyRequests(
      {
        id: String(id || "").trim(),
      },
      { take: 1 }
    );
    const request = requests[0];

    if (!request) {
      throw new Error("Privacy request not found");
    }

    await this.updatePrivacyRequestStatus({
      id: request.id,
      status: "in_progress",
    });

    const customerEmail = normalizeEmail(request.customer_email);
    const customerId = String(request.customer_id || "").trim();
    const complaintCandidates = await generated.listComplaintCases({}, { take: 5000 });
    const returnCandidates = await generated.listReturnRequestCases({}, { take: 5000 });
    const complaints = complaintCandidates.filter((item) => {
      const sameEmail = customerEmail
        ? normalizeEmail(item.customer_email) === customerEmail
        : false;
      const sameCustomerId = customerId ? String(item.customer_id || "") === customerId : false;
      return sameEmail || sameCustomerId;
    });
    const returns = returnCandidates.filter((item) => {
      const sameEmail = customerEmail
        ? normalizeEmail(item.customer_email) === customerEmail
        : false;
      const sameCustomerId = customerId ? String(item.customer_id || "") === customerId : false;
      return sameEmail || sameCustomerId;
    });
    const payload = {
      generated_at: new Date().toISOString(),
      complaint_count: complaints.length,
      return_count: returns.length,
      complaints,
      returns,
    };
    const updated = await this.updatePrivacyRequestStatus({
      id: request.id,
      status: "completed",
      resultSummary: `Export generated with ${complaints.length} complaints and ${returns.length} returns`,
      payload,
    });

    return {
      request: updated,
      export: payload,
    };
  }

  async runPrivacyAnonymize({
    id,
    dryRun = true,
  }: {
    id: string;
    dryRun?: boolean;
  }) {
    const generated = this as unknown as GeneratedOpsModuleService;
    const requests = await generated.listPrivacyRequests(
      {
        id: String(id || "").trim(),
      },
      { take: 1 }
    );
    const request = requests[0];

    if (!request) {
      throw new Error("Privacy request not found");
    }

    await this.updatePrivacyRequestStatus({
      id: request.id,
      status: "in_progress",
    });

    const customerEmail = normalizeEmail(request.customer_email);
    const customerId = String(request.customer_id || "").trim();
    const complaintCandidates = await generated.listComplaintCases({}, { take: 5000 });
    const returnCandidates = await generated.listReturnRequestCases({}, { take: 5000 });
    const complaintTargets = complaintCandidates.filter((item) => {
      const sameEmail = customerEmail
        ? normalizeEmail(item.customer_email) === customerEmail
        : false;
      const sameCustomerId = customerId ? String(item.customer_id || "") === customerId : false;
      return sameEmail || sameCustomerId;
    });
    const returnTargets = returnCandidates.filter((item) => {
      const sameEmail = customerEmail
        ? normalizeEmail(item.customer_email) === customerEmail
        : false;
      const sameCustomerId = customerId ? String(item.customer_id || "") === customerId : false;
      return sameEmail || sameCustomerId;
    });
    const anonymizedCustomerId = anonymizeIdentifier(
      customerId || customerEmail || request.id,
      "cust"
    );
    const anonymizedEmail = anonymizeEmail(customerEmail || request.customer_email || request.id);

    if (!dryRun) {
      for (const complaint of complaintTargets) {
        await generated.updateComplaintCases({
          selector: {
            id: complaint.id,
          },
          data: {
            customer_id: anonymizedCustomerId,
            customer_email: anonymizedEmail,
            metadata: {
              ...(complaint.metadata || {}),
              privacy_anonymized: true,
              privacy_anonymized_at: new Date().toISOString(),
            },
          },
        });
      }

      for (const returnCase of returnTargets) {
        await generated.updateReturnRequestCases({
          selector: {
            id: returnCase.id,
          },
          data: {
            customer_id: anonymizedCustomerId,
            customer_email: anonymizedEmail,
            metadata: {
              ...(returnCase.metadata || {}),
              privacy_anonymized: true,
              privacy_anonymized_at: new Date().toISOString(),
            },
          },
        });
      }
    }

    const payload = {
      dry_run: dryRun,
      target_counts: {
        complaints: complaintTargets.length,
        returns: returnTargets.length,
      },
      anonymized_customer_id: anonymizedCustomerId,
      anonymized_customer_email: anonymizedEmail,
    };
    const updated = await this.updatePrivacyRequestStatus({
      id: request.id,
      status: dryRun ? "skipped" : "completed",
      resultSummary: dryRun
        ? `Dry run: ${complaintTargets.length} complaints and ${returnTargets.length} returns would be anonymized`
        : `Anonymized ${complaintTargets.length} complaints and ${returnTargets.length} returns`,
      payload,
    });

    return {
      request: updated,
      anonymization: payload,
    };
  }

  async getOpsDashboardSummary() {
    const generated = this as unknown as GeneratedOpsModuleService;
    const [complaints, returns, imports, integrations, taxConfigurations, auditLogs, privacyRequests] =
      await Promise.all([
        generated.listComplaintCases({}, { take: 2000 }),
        generated.listReturnRequestCases({}, { take: 2000 }),
        generated.listImportJobs({}, { take: 2000 }),
        generated.listIntegrationConnectors({}, { take: 200 }),
        generated.listTaxConfigurations({}, { take: 500 }),
        generated.listAuditLogs({}, { take: 2000 }),
        generated.listPrivacyRequests({}, { take: 2000 }),
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
      audit_logs: {
        total: auditLogs.length,
        byActorType: statusCount(auditLogs, "actor_type"),
      },
      privacy_requests: {
        total: privacyRequests.length,
        byStatus: statusCount(privacyRequests, "status"),
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
