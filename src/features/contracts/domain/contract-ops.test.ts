import { describe, expect, it } from "vitest";
import { summarizeDetails, toAudit, toKpis, type BackendKpis } from "../application/contract-ops.http-repository";
import { alertReasonLabel, auditActionLabel, rateBlocker, switchModeBlocker, unblockBlocker, updateRateBlocker } from "./contract-ops";
import type { LeaseContract } from "./lease-contract";

const contract = (over: Partial<LeaseContract> = {}): LeaseContract => ({
  id: "c1", driverId: "d1", driverName: "K", vehicleLabel: "Bajaj", plate: "AB", startDate: "x", endDate: "y", frequency: "weekly", installmentCount: 40, installmentAmount: 15000,
  totalAmount: 600000, downPayment: 0, paid: 0, remaining: 600000, unpaidCount: 0, status: "active", repaymentMode: "schedule", ...over,
});

describe("contrats : suivi et prélèvement sur les revenus (backend wami-co)", () => {
  it("convertit les indicateurs", () => {
    const k: BackendKpis = { contracts: { total: 5, active: 3, suspended: 1, completed: 1, broken: 0 }, financials: { totalMontantPaye: 100, totalMontantRestant: 400, totalResidualDebt: 20 }, installments: { overdueCount: 4 }, blocking: { atRiskCount: 2, blockedCount: 1, threshold: 3 } };
    expect(toKpis(k)).toMatchObject({ paid: 100, remaining: 400, residualDebt: 20, overdueInstallments: 4, atRisk: 2, blocked: 1, blockThreshold: 3 });
  });
  it("résume les détails d'audit sans les objets imbriqués", () => {
    expect(summarizeDetails({ amount: 15000, who: "x", nested: { a: 1 }, nothing: null })).toBe("amount : 15000 · who : x");
    expect(toAudit({ id: "a", action: "MANUAL_PAYMENT", performedBy: "u", details: { amount: 1 }, occurredAt: "t" })).toMatchObject({ contractId: null, details: "amount : 1" });
    expect(auditActionLabel("MANUAL_PAYMENT")).toBe("Versement manuel");
    expect(auditActionLabel("AUTRE")).toBe("AUTRE");
    expect(alertReasonLabel("INACTIVITY")).toBe("Chauffeur inactif");
  });
  it("taux : strictement positif et au plus 100 %", () => {
    expect(rateBlocker(0.2)).toBeNull();
    expect(rateBlocker(1)).toBeNull();
    expect(rateBlocker(0)).not.toBeNull();
    expect(rateBlocker(1.2)).not.toBeNull();
  });
  it("passage de mode : une seule fois, contrat actif ou suspendu", () => {
    expect(switchModeBlocker(contract(), 0.2)).toBeNull();
    expect(switchModeBlocker(contract({ repaymentMode: "revenueShare" }), 0.2)).toMatch(/déjà/);
    expect(switchModeBlocker(contract({ status: "broken" }), 0.2)).toMatch(/actif ou suspendu/);
    expect(switchModeBlocker(contract(), 0)).toMatch(/taux/i);
  });
  it("modification du taux seulement en prélèvement sur les revenus", () => {
    expect(updateRateBlocker(contract(), 0.2)).toMatch(/s'applique/);
    expect(updateRateBlocker(contract({ repaymentMode: "revenueShare" }), 0.3)).toBeNull();
  });
  it("déblocage du chauffeur seulement au seuil d'impayés", () => {
    expect(unblockBlocker(contract({ unpaidCount: 2 }), 3)).toMatch(/pas bloqué/);
    expect(unblockBlocker(contract({ unpaidCount: 3 }), 3)).toBeNull();
    expect(unblockBlocker(contract({ unpaidCount: 5, status: "completed" }), 3)).toMatch(/plus actif/);
  });
});
