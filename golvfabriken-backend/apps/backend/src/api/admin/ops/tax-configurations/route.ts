import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

type TaxConfigurationPayload = {
  country_code?: string;
  region_code?: string;
  currency_code?: string;
  vat_rate?: number;
  is_tax_inclusive?: boolean;
  eu_oss_enabled?: boolean;
  reverse_charge_enabled?: boolean;
  status?: "draft" | "active" | "archived";
  notes?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const status = req.query.status ? String(req.query.status) : undefined;
  const countryCode = req.query.country_code
    ? String(req.query.country_code)
    : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const items = await opsService.getTaxConfigurations({
    status: status as any,
    countryCode,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    tax_configurations: items,
  });
}

export async function POST(
  req: MedusaRequest<TaxConfigurationPayload>,
  res: MedusaResponse
) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const payload = req.body || {};

  if (!payload.country_code) {
    res.status(400).json({
      message: "country_code is required",
    });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const configuration = await opsService.upsertTaxConfiguration({
    countryCode: payload.country_code,
    regionCode: payload.region_code,
    currencyCode: payload.currency_code,
    vatRate: payload.vat_rate,
    isTaxInclusive: payload.is_tax_inclusive,
    euOssEnabled: payload.eu_oss_enabled,
    reverseChargeEnabled: payload.reverse_charge_enabled,
    status: payload.status,
    notes: payload.notes,
    metadata: payload.metadata,
  });

  res.status(200).json({
    status: "ok",
    tax_configuration: configuration,
  });
}
