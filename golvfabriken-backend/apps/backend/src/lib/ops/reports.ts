const csvEscape = (value: unknown) => {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const flattenStatusMap = (
  section: string,
  byStatus: Record<string, number> = {},
  total = 0
) => {
  const rows: Array<{ section: string; metric: string; value: number }> = [];

  rows.push({
    section,
    metric: "total",
    value: Number(total) || 0,
  });

  for (const [status, count] of Object.entries(byStatus)) {
    rows.push({
      section,
      metric: `status:${status}`,
      value: Number(count) || 0,
    });
  }

  return rows;
};

export const buildOpsSummaryRows = (summary: any) => {
  const rows: Array<{ section: string; metric: string; value: number }> = [];

  rows.push(...flattenStatusMap("complaints", summary?.complaints?.byStatus, summary?.complaints?.total));
  rows.push(...flattenStatusMap("returns", summary?.returns?.byStatus, summary?.returns?.total));
  rows.push(...flattenStatusMap("imports", summary?.imports?.byStatus, summary?.imports?.total));
  rows.push(
    ...flattenStatusMap(
      "tax_configurations",
      summary?.tax_configurations?.byStatus,
      summary?.tax_configurations?.total
    )
  );
  rows.push(
    ...flattenStatusMap("integrations", summary?.integrations?.byStatus, summary?.integrations?.total)
  );
  rows.push(
    ...flattenStatusMap(
      "b2b_companies",
      summary?.b2b?.companies?.byStatus,
      summary?.b2b?.companies?.total
    )
  );
  rows.push(
    ...flattenStatusMap(
      "b2b_users",
      summary?.b2b?.users?.byStatus,
      summary?.b2b?.users?.total
    )
  );
  rows.push(
    ...flattenStatusMap(
      "b2b_approvals",
      summary?.b2b?.approvals?.byStatus,
      summary?.b2b?.approvals?.total
    )
  );
  rows.push(
    ...flattenStatusMap(
      "b2b_quotes",
      summary?.b2b?.quotes?.byStatus,
      summary?.b2b?.quotes?.total
    )
  );

  return rows;
};

export const buildOpsSummaryCsv = (summary: any) => {
  const rows = buildOpsSummaryRows(summary);
  const headers = ["section", "metric", "value"];
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(
      [csvEscape(row.section), csvEscape(row.metric), csvEscape(row.value)].join(",")
    );
  }

  return lines.join("\n");
};

export const buildAuditCsv = (auditLogs: any[]) => {
  const headers = [
    "id",
    "created_at",
    "entity_type",
    "entity_id",
    "action",
    "actor_type",
    "actor_id",
    "actor_email",
    "source",
  ];
  const lines = [headers.join(",")];

  for (const item of auditLogs || []) {
    lines.push(
      [
        csvEscape(item.id),
        csvEscape(item.created_at),
        csvEscape(item.entity_type),
        csvEscape(item.entity_id || ""),
        csvEscape(item.action),
        csvEscape(item.actor_type),
        csvEscape(item.actor_id || ""),
        csvEscape(item.actor_email || ""),
        csvEscape(item.source || ""),
      ].join(",")
    );
  }

  return lines.join("\n");
};
