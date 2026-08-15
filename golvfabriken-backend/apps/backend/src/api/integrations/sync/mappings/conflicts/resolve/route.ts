import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SYNC_MODULE } from "../../../../../../modules/sync";
import SyncModuleService from "../../../../../../modules/sync/service";
import { validateSyncAdminSecret } from "../../../utils/admin-auth";

type ResolveMappingConflictsPayload = {
  ids?: string[];
  status?: "pending" | "synced" | "failed" | "conflict";
  note?: string;
};

const allowedStatuses = new Set(["pending", "synced", "failed", "conflict"]);

export async function POST(
  req: MedusaRequest<ResolveMappingConflictsPayload>,
  res: MedusaResponse
) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const payload = req.body || {};
  const ids = Array.isArray(payload.ids)
    ? payload.ids.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!ids.length) {
    res.status(400).json({
      message: "ids array is required",
    });
    return;
  }

  const requestedStatus = String(payload.status || "synced");
  const status = (allowedStatuses.has(requestedStatus)
    ? requestedStatus
    : "synced") as "pending" | "synced" | "failed" | "conflict";
  const syncService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const result = await syncService.resolveMappingConflicts({
    ids,
    status,
    note: payload.note,
  });

  res.status(200).json({
    status: "ok",
    resolution: result,
  });
}
