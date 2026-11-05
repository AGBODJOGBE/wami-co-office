import { describe, expect, it } from "vitest";
import { toDebts, toOverview, toRevenue } from "../application/receivables.http-repository";
import { ageDays, isDefinitive } from "./receivables";

describe("revenus et créances (backend wami-co)", () => {
  it("convertit le rapport de revenus et masque les lignes sans libellé", () => {
    const r = toRevenue({ balance: 10, totalRevenue: 100, netResult: 60, breakdown: [{ source: "A", label: "Courses", total: 100 }, { source: "B", label: "", total: 0 }], outflows: { total: 40, breakdown: [{ source: "X", label: "Bonus", category: "DEFINITIVE_EXPENSE", total: 40 }] } });
    expect(r).toMatchObject({ totalRevenue: 100, outflows: 40, net: 60 });
    expect(r.breakdown).toHaveLength(1);
    expect(isDefinitive(r.outflowBreakdown[0]!)).toBe(true);
  });
  it("convertit créances et dettes", () => {
    expect(toOverview({ drivers: [{ driverId: "d", driverName: "", contractReceivable: 1, commissionReceivable: 2, totalReceivable: 3, oldestReceivableAt: null }], totals: { contractReceivable: 1, commissionReceivable: 2, totalReceivable: 3 } }).rows[0]).toMatchObject({ driverName: "—", total: 3 });
    expect(toDebts({ drivers: [{ driverId: "d", walletId: "w", driverName: "K", driverPhone: "+229", driverStatus: "", debtAmount: 5 }], totalDebtAmount: 5 })).toMatchObject({ total: 5, rows: [{ amount: 5 }] });
  });
  it("âge d'une créance en jours", () => {
    const now = new Date("2026-11-10T00:00:00Z");
    expect(ageDays("2026-11-05T00:00:00Z", now)).toBe(5);
    expect(ageDays(null, now)).toBeNull();
  });
});
