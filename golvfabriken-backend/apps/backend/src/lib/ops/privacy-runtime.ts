import crypto from "crypto";

const normalizeValue = (value?: string | null) => {
  return String(value || "").trim();
};

const hash = (value: string, salt?: string) => {
  const hasher = crypto.createHash("sha256");
  hasher.update(`${salt || "ops-default-salt"}:${value}`);
  return hasher.digest("hex").slice(0, 16);
};

export const normalizeEmail = (value?: string | null) => {
  return normalizeValue(value).toLowerCase();
};

export const anonymizeIdentifier = (
  value?: string | null,
  prefix = "anon",
  salt = process.env.OPS_PRIVACY_ANONYMIZE_SALT
) => {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return "";
  }

  return `${prefix}_${hash(normalized.toLowerCase(), salt)}`;
};

export const anonymizeEmail = (
  value?: string | null,
  salt = process.env.OPS_PRIVACY_ANONYMIZE_SALT
) => {
  const email = normalizeEmail(value);

  if (!email) {
    return "";
  }

  return `${anonymizeIdentifier(email, "anon", salt)}@redacted.local`;
};
