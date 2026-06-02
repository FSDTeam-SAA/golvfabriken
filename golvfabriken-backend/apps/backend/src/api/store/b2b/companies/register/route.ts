import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";

type StoreB2BCompanyRegisterPayload = {
  name?: string;
  company_code?: string;
  organization_number?: string;
  vat_id?: string;
  contact_email?: string;
  contact_name?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(
  req: MedusaRequest<StoreB2BCompanyRegisterPayload>,
  res: MedusaResponse
) {
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
      status: "pending",
      metadata: {
        source: "storefront",
        contact_email: payload.contact_email || null,
        contact_name: payload.contact_name || null,
        ...(payload.metadata || {}),
      },
    });

    res.status(201).json({
      status: "received",
      company_id: company.id,
      company_code: company.company_code,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
