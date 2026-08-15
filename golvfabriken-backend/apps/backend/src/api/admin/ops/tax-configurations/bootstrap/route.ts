import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

const bootstrapProfiles = [
  {
    countryCode: "se",
    currencyCode: "sek",
    vatRate: 25,
    isTaxInclusive: true,
    euOssEnabled: true,
    reverseChargeEnabled: true,
    status: "active" as const,
    notes: "Sweden default VAT profile bootstrap",
  },
  {
    countryCode: "se",
    regionCode: "b2b",
    currencyCode: "sek",
    vatRate: 0,
    isTaxInclusive: false,
    euOssEnabled: true,
    reverseChargeEnabled: true,
    status: "draft" as const,
    notes: "Draft reverse-charge B2B profile for validation",
  },
];

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const profiles: any[] = [];

  for (const profile of bootstrapProfiles) {
    const saved = await opsService.upsertTaxConfiguration(profile);
    profiles.push(saved);
  }

  res.status(200).json({
    status: "ok",
    tax_configurations: profiles,
  });
}
