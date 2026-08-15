import { buildAuditCsv, buildOpsSummaryCsv, buildOpsSummaryRows } from "../reports";

describe("ops reports helpers", () => {
  it("builds rows from ops summary", () => {
    const rows = buildOpsSummaryRows({
      complaints: { total: 2, byStatus: { open: 1, resolved: 1 } },
      returns: { total: 1, byStatus: { requested: 1 } },
      imports: { total: 3, byStatus: { completed: 2, failed: 1 } },
      tax_configurations: { total: 1, byStatus: { active: 1 } },
      integrations: { total: 2, byStatus: { active: 1, skipped: 1 } },
      b2b: {
        companies: { total: 1, byStatus: { active: 1 } },
        users: { total: 2, byStatus: { active: 2 } },
        approvals: { total: 1, byStatus: { pending: 1 } },
        quotes: { total: 1, byStatus: { requested: 1 } },
      },
    });

    expect(rows.length).toBeGreaterThan(5);
    expect(rows.some((row) => row.section === "complaints" && row.metric === "total")).toBe(
      true
    );
  });

  it("builds csv output", () => {
    const csv = buildOpsSummaryCsv({
      complaints: { total: 1, byStatus: { open: 1 } },
      returns: { total: 0, byStatus: {} },
      imports: { total: 0, byStatus: {} },
      tax_configurations: { total: 0, byStatus: {} },
      integrations: { total: 0, byStatus: {} },
      b2b: {
        companies: { total: 0, byStatus: {} },
        users: { total: 0, byStatus: {} },
        approvals: { total: 0, byStatus: {} },
        quotes: { total: 0, byStatus: {} },
      },
    });

    expect(csv.startsWith("section,metric,value")).toBe(true);
    expect(csv.includes("complaints,total,1")).toBe(true);
  });

  it("builds audit csv output", () => {
    const csv = buildAuditCsv([
      {
        id: "audit_1",
        created_at: "2026-05-30T10:00:00.000Z",
        entity_type: "import_job",
        entity_id: "impjob_1",
        action: "status_update",
        actor_type: "system",
        actor_id: "",
        actor_email: "",
        source: "ops.service.updateImportJobStatus",
      },
    ]);

    expect(csv.startsWith("id,created_at,entity_type")).toBe(true);
    expect(csv.includes("audit_1")).toBe(true);
  });
});
