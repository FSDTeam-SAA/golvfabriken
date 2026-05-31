import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OPS_MODULE } from "../../../../../modules/ops";
import OpsModuleService from "../../../../../modules/ops/service";
import { buildAuditCsv } from "../../../../../lib/ops/reports";
import { validateOpsAdminSecret } from "../../utils/admin-auth";

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
  const limit = req.query.limit ? Number(req.query.limit) : 5000;
  const opsService: OpsModuleService = req.scope.resolve(OPS_MODULE);
  const items = await opsService.getAuditEvents({
    entityType,
    entityId,
    action,
    actorType: actorType as any,
    limit,
  });
  const csv = buildAuditCsv(items);
  const fileName = `ops-audit-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(csv);
}
