import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

const defaultConnectors = [
  {
    key: "fraktjakt",
    displayName: "Fraktjakt",
    category: "shipping" as const,
    status: "skipped" as const,
    skipReason: "SKIP_UNTIL_API_KEYS_AVAILABLE",
  },
  {
    key: "klarna",
    displayName: "Klarna",
    category: "payment" as const,
    status: "skipped" as const,
    skipReason: "SKIP_UNTIL_API_KEYS_AVAILABLE",
  },
  {
    key: "fortnox",
    displayName: "Fortnox",
    category: "accounting" as const,
    status: "skipped" as const,
    skipReason: "SKIP_UNTIL_API_KEYS_AVAILABLE",
  },
];

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const results: any[] = [];

  for (const connector of defaultConnectors) {
    const registered = await opsService.registerIntegrationConnector({
      key: connector.key,
      displayName: connector.displayName,
      category: connector.category,
      status: connector.status,
      skipReason: connector.skipReason,
    });
    results.push(registered);
  }

  res.status(200).json({
    status: "ok",
    connectors: results,
  });
}
