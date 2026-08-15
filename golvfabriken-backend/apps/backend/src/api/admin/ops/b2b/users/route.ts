import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

type B2BUserPayload = {
  company_id?: string;
  medusa_customer_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: "admin" | "buyer" | "approver";
  status?: "invited" | "active" | "disabled";
  approval_limit?: number;
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const companyId = req.query.company_id ? String(req.query.company_id) : undefined;
  const role = req.query.role ? String(req.query.role) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getB2BCompanyUsers({
    companyId,
    role: role as any,
    status: status as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    users: items,
  });
}

export async function POST(req: MedusaRequest<B2BUserPayload>, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};

  if (!payload.company_id || !payload.email) {
    res.status(400).json({
      message: "company_id and email are required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);

  try {
    const user = await opsService.createB2BCompanyUser({
      companyId: payload.company_id,
      medusaCustomerId: payload.medusa_customer_id,
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
      role: payload.role,
      status: payload.status,
      approvalLimit: payload.approval_limit,
      metadata: payload.metadata,
    });

    res.status(201).json({
      status: "ok",
      user,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
