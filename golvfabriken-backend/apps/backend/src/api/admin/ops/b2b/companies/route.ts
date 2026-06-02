import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type B2BCompanyPayload = {
  name?: string;
  company_code?: string;
  organization_number?: string;
  vat_id?: string;
  status?: "pending" | "active" | "suspended" | "rejected";
  sales_manager_id?: string;
  credit_limit?: number;
  payment_terms_days?: number;
  spend_approval_threshold?: number;
  price_list_code?: string;
  default_currency_code?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const status = req.query.status ? String(req.query.status) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getB2BCompanies({
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    companies: items,
  });
}

export async function POST(
  req: MedusaRequest<B2BCompanyPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};

  if (!payload.name) {
    res.status(400).json({
      message: "name is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const company = await opsService.createB2BCompany({
      name: payload.name,
      companyCode: payload.company_code,
      organizationNumber: payload.organization_number,
      vatId: payload.vat_id,
      status: payload.status,
      salesManagerId: payload.sales_manager_id,
      creditLimit: payload.credit_limit,
      paymentTermsDays: payload.payment_terms_days,
      spendApprovalThreshold: payload.spend_approval_threshold,
      priceListCode: payload.price_list_code,
      defaultCurrencyCode: payload.default_currency_code,
      metadata: payload.metadata,
    });

    res.status(201).json({
      status: "ok",
      company,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
