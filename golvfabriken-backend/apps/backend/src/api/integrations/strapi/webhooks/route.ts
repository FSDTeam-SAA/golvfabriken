import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  normalizeStrapiWebhookEvent,
  shouldIgnoreStrapiWebhook,
  validateStrapiWebhookSecret,
  type StrapiWebhookPayload,
} from "../../../../lib/sync/strapi-webhook";
import { enqueueSyncEventId } from "../../../../lib/sync/queue";
import { SYNC_MODULE } from "../../../../modules/sync";
import SyncModuleService from "../../../../modules/sync/service";

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
  const syncModuleService: SyncModuleService = req.scope.resolve(SYNC_MODULE);
  const persisted = await syncModuleService.recordEvent({
    event: normalizedEvent,
    status: ignored ? "ignored" : "received",
    rawPayload: payload,
    processedAt: ignored ? new Date() : undefined,
  });

  if (!persisted.duplicate && !ignored && persisted.event?.id) {
    await enqueueSyncEventId(String(persisted.event.id));
  }

  res.status(202).json({
    status: persisted.duplicate ? "duplicate" : ignored ? "ignored" : "received",
    duplicate: persisted.duplicate,
    event: persisted.event,
    mapping: persisted.mapping,
  });
}
