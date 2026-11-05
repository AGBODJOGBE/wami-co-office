import { describe, expect, it } from "vitest";
import { approveBlocker, net, selectionTotal, submitBlocker, type PayoutBatch, type PayoutLine } from "./payout";

const line = (id: string, sales: number, commission: number, adjustments: number, status: PayoutLine["status"] = "ready"): PayoutLine => ({
  id,
  beneficiary: id,
  type: "pro",
  sales,
  commission,
  adjustments,
  method: "MoMo",
  status,
  failureReason: null,
});

const batch = (over: Partial<PayoutBatch> = {}): PayoutBatch => ({
  id: "b1",
  payoutDate: "2026-11-09",
  status: "draft",
  preparedBy: null,
  approvedBy: null,
  lines: [line("a", 100_000, 15_000, -5_000), line("b", 10_000, 1_500, -20_000), line("c", 30_000, 4_500, 0, "failed")],
  selectedIds: [],
  ...over,
});

describe("lot de versement", () => {
  it("net = ventes − commission + ajustements", () => {
    expect(net(batch().lines[0]!)).toBe(80_000);
  });

  it("les lignes négatives ou en échec ne comptent pas", () => {
    expect(selectionTotal(batch(), ["a", "b", "c"])).toBe(80_000);
    expect(submitBlocker(batch(), ["a", "b"])).not.toBeNull();
    expect(submitBlocker(batch(), ["a"])).toBeNull();
  });

  it("celui qui prépare ne peut pas approuver", () => {
    const b = batch({ status: "submitted", preparedBy: "agent-1" });
    expect(approveBlocker(b, "agent-1")).toMatch(/Double validation/);
    expect(approveBlocker(b, "agent-2")).toBeNull();
  });
});
