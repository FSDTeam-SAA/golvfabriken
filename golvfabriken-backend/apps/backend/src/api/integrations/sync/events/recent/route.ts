import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SYNC_MODULE } from "../../../../../modules/sync";
import SyncModuleService from "../../../../../modules/sync/service";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const limit = Number(req.query.limit || 50);
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const events = await syncService.listRecentEvents(
    Number.isFinite(limit) && limit > 0 ? limit : 50
  );

  res.status(200).json({
    status: "ok",
    count: events.length,
    events,
  });
}
