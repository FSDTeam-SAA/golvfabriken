import { MedusaRequest } from "@medusajs/framework/http";

const getHeader = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export const validateOpsAdminSecret = (req: MedusaRequest) => {
  const expected = process.env.OPS_ADMIN_SECRET;

  if (!expected) {
    return {
      valid: false as const,
      reason: "OPS_ADMIN_SECRET is not configured",
    };
  }

  const received =
    getHeader(req.headers["x-ops-admin-secret"]) ||
    getHeader(req.headers["x-sync-admin-secret"]) ||
    getHeader(req.headers.authorization)?.replace(/^Bearer\s+/i, "");

  if (!received) {
    return {
      valid: false as const,
      reason: "Missing ops admin secret header",
    };
  }

  if (received !== expected) {
    return {
      valid: false as const,
      reason: "Invalid ops admin secret",
    };
  }

  return { valid: true as const };
};
