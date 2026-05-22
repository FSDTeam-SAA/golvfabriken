import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  normalizeStrapiWebhookEvent,
  shouldIgnoreStrapiWebhook,
  validateStrapiWebhookSecret,
  type StrapiWebhookPayload,
} from "../../../../lib/sync/strapi-webhook";
import { toSyncEventRecord } from "../../../../lib/sync/events";

export async function POST(
  req: MedusaRequest<StrapiWebhookPayload>,
  res: MedusaResponse
) {
  const validation = validateStrapiWebhookSecret(
    req.headers,
    process.env.STRAPI_WEBHOOK_SECRET
  );

  if (!validation.valid) {
    res.status(401).json({
      message: validation.reason,
    });
    return;
  }

  const payload = req.body || {};
  const normalizedEvent = normalizeStrapiWebhookEvent({
    payload,
    eventId: req.headers["x-strapi-event-id"] as string | undefined,
    correlationId: req.headers["x-correlation-id"] as string | undefined,
  });

  const ignored = shouldIgnoreStrapiWebhook(payload);

  // Persistence and queue dispatch come next. For now this endpoint validates
  // and normalizes the event contract used by the sync worker.
  res.status(202).json({
    status: ignored ? "ignored" : "received",
    event: ignored
      ? {
          ...toSyncEventRecord(normalizedEvent),
          status: "ignored",
          processed_at: new Date().toISOString(),
        }
      : toSyncEventRecord(normalizedEvent),
  });
}
