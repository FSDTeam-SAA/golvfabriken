import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../../modules/ops";
import OpsModuleService from "../../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../../utils/admin-auth";

type ProductCatalogExecutePayload = {
  csv_content?: string;
  file_path?: string;
  delimiter?: "," | ";" | "\t";
  requested_by?: string;
  source_label?: string;
  apply_mode?: "dry_run" | "validate_and_stage";
  max_preview_rows?: number;
};

export async function POST(
  req: MedusaRequest<ProductCatalogExecutePayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const hasInlineContent = String(payload.csv_content || "").trim().length > 0;
  const hasFilePath = String(payload.file_path || "").trim().length > 0;

  if (!hasInlineContent && !hasFilePath) {
    res.status(400).json({
      message: "csv_content or file_path is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const result = await opsService.executeProductCatalogImport({
      requestedBy: payload.requested_by,
      filePath: hasFilePath ? String(payload.file_path).trim() : undefined,
      csvContent: hasInlineContent ? payload.csv_content : undefined,
      delimiter: payload.delimiter,
      sourceLabel: payload.source_label,
      applyMode: payload.apply_mode || "dry_run",
      maxPreviewRows: payload.max_preview_rows,
    });

    res.status(200).json({
      status: "ok",
      import_execution: result,
    });
  } catch (error) {
    res.status(422).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
