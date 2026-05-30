import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getSyncQueuePauseState, setSyncQueuePaused } from "../../../../../lib/sync/queue";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

type PauseQueuePayload = {
  paused?: boolean;
  reason?: string;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = validateSyncAdminSecret(req);

  if (!auth.valid) {
    res.status(401).json({
      message: auth.reason,
    });
    return;
  }

  const pause = await getSyncQueuePauseState();

  res.status(200).json({
    status: "ok",
    pause,
  });
}

export async function POST(
  req: MedusaRequest<PauseQueuePayload>,
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
  const paused = payload.paused !== false;
  const pause = await setSyncQueuePaused({
    paused,
    reason: payload.reason,
  });

  res.status(200).json({
    status: "ok",
    pause,
  });
}
