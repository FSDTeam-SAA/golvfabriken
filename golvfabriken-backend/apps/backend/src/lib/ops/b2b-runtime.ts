export const normalizeB2BCompanyCode = (value: string) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
};

export const shouldAutoApproveB2BOrder = ({
  threshold,
  amountTotal,
}: {
  threshold?: number;
  amountTotal?: number;
}) => {
  const normalizedThreshold = Number(threshold || 0);
  const normalizedAmount = Number(amountTotal || 0);

  return normalizedThreshold <= 0 || normalizedAmount <= normalizedThreshold;
};
