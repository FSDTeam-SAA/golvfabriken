import { MedusaRequest } from "@medusajs/framework/http";

const readHeader = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export const validateSyncAdminSecret = (req: MedusaRequest) => {
  const expectedSecret = process.env.SYNC_ADMIN_SECRET;

  if (!expectedSecret) {
    return {
      valid: false,
      reason: "SYNC_ADMIN_SECRET is not configured",
    };
  }

  const receivedSecret = readHeader(req.headers["x-sync-admin-secret"]);

  if (!receivedSecret) {
    return {
      valid: false,
      reason: "Missing x-sync-admin-secret header",
    };
  }

  if (receivedSecret !== expectedSecret) {
    return {
      valid: false,
      reason: "Invalid sync admin secret",
    };
  }

  return { valid: true };
};
