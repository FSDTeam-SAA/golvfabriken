import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

type DepotOption = {
  id: string;
  name: string;
  reference?: string;
  address?: string;
};

const asStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeDepotOption = (value: unknown, index: number): DepotOption | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = String(row.id || row.reference || `depot_${index + 1}`).trim();
  const name = String(row.name || row.title || row.reference || id).trim();

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    reference: row.reference ? String(row.reference).trim() : undefined,
    address: row.address ? String(row.address).trim() : undefined,
  };
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyId = String(req.query.company_id || "").trim();

  if (!companyId) {
    res.status(400).json({
      message: "company_id is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const companies = await opsService.getB2BCompanies({ limit: 2000 });
  const company = companies.find((item) => {
    return String(item.id || "").trim() === companyId;
  });

  if (!company) {
    res.status(404).json({
      message: "B2B company not found",
    });
    return;
  }

  const metadata = (company.metadata || {}) as Record<string, unknown>;
  const rawDepots = Array.isArray(metadata.depots)
    ? metadata.depots
    : Array.isArray(metadata.depot_addresses)
      ? metadata.depot_addresses
      : [];
  const depots = rawDepots
    .map((item, index) => normalizeDepotOption(item, index))
    .filter(Boolean) as DepotOption[];
  const allowedPaymentMethodIds = asStringArray(
    metadata.allowed_payment_methods || metadata.allowed_payment_method_ids
  );
  const approvalRequired = Boolean(
    metadata.approval_required || Number(company.spend_approval_threshold || 0) > 0
  );

  res.status(200).json({
    status: "ok",
    context: {
      company_id: company.id,
      company_code: company.company_code,
      company_name: company.name,
      company_status: company.status,
      payment_terms_days: Number(company.payment_terms_days || 0),
      approval_threshold: Number(company.spend_approval_threshold || 0),
      approval_required: approvalRequired,
      allowed_payment_method_ids: allowedPaymentMethodIds,
      depots,
    },
  });
}
