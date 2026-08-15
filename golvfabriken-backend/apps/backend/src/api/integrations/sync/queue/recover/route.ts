import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getSyncQueueVisibilityTimeoutSeconds,
  recoverStaleProcessingQueueEntries,
} from "../../../../../lib/sync/queue";
import { validateSyncAdminSecret } from "../../utils/admin-auth";

type RecoverQueuePayload = {
  stale_after_seconds?: number;
  limit?: number;
};

const toPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function POST(
  req: MedusaRequest<RecoverQueuePayload>,
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
  const staleAfterSeconds = toPositiveNumber(
    payload.stale_after_seconds,
    getSyncQueueVisibilityTimeoutSeconds()
  );
  const limit = toPositiveNumber(payload.limit, 100);
  const recovered = await recoverStaleProcessingQueueEntries({
    staleAfterSeconds,
    limit,
  });

  res.status(200).json({
    status: "ok",
    recovered,
    controls: {
      stale_after_seconds: staleAfterSeconds,
      limit,
    },
  });
}
