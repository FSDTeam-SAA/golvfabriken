import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../modules/ops";
import OpsModuleService from "../../../../modules/ops/service";
import { validateOpsAdminSecret } from "../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateOpsAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({ message: auth.reason });
    return;
  }

  const entityType = req.query.entity_type ? String(req.query.entity_type) : undefined;
  const entityId = req.query.entity_id ? String(req.query.entity_id) : undefined;
  const action = req.query.action ? String(req.query.action) : undefined;
  const actorType = req.query.actor_type ? String(req.query.actor_type) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getAuditEvents({
    entityType,
    entityId,
    action,
    actorType: actorType as any,
    limit,
  });

  res.status(200).json({
    status: "ok",
    count: items.length,
    audit_logs: items,
  });
}
