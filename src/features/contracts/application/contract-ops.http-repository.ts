import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AuditLine, FleetKpis, RevenueShareAlert, Withholding } from "../domain/contract-ops";
import type { ContractOpsRepository } from "../domain/contract-ops.repository";

export interface BackendKpis {
  contracts: FleetKpis["contracts"];
  financials: { totalMontantPaye: number; totalMontantRestant: number; totalResidualDebt: number };
  installments: { overdueCount: number };
  blocking: { atRiskCount: number; blockedCount: number; threshold: number };
}

export const toKpis = (k: BackendKpis): FleetKpis => ({
  contracts: k.contracts,
  paid: k.financials.totalMontantPaye,
  remaining: k.financials.totalMontantRestant,
  residualDebt: k.financials.totalResidualDebt,
  overdueInstallments: k.installments.overdueCount,
  atRisk: k.blocking.atRiskCount,
  blocked: k.blocking.blockedCount,
  blockThreshold: k.blocking.threshold,
});

export interface BackendAudit {
  id: string;
  contractId?: string;
  driverId?: string;
  action: string;
  performedBy: string;
  details: Record<string, unknown>;
  occurredAt: string;
}

/** Détails d'un événement d'audit sur une ligne : « clé : valeur ». */
export const summarizeDetails = (d: Record<string, unknown>) =>
  Object.entries(d)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => `${k} : ${String(v)}`)
    .join(" · ");

export const toAudit = (a: BackendAudit): AuditLine => ({ id: a.id, action: a.action, contractId: a.contractId ?? null, driverId: a.driverId ?? null, by: a.performedBy, at: a.occurredAt, details: summarizeDetails(a.details ?? {}) });

export class HttpContractOpsRepository implements ContractOpsRepository {
  async kpis() {
    return toKpis(await http.get<BackendKpis>(API.contracts.kpis));
  }
  async audit() {
    const { items } = await http.get<{ items: BackendAudit[] }>(API.contracts.auditLogs, { limit: 50 });
    return items.map(toAudit);
  }
  async alerts() {
    const { items } = await http.get<{ items: Array<{ contractId: string; driverId: string; montantNonReconnu: number; montantRestant: number; lastWithholdingDate: string | null; reasons: string[] }> }>(API.contracts.revenueShareAlerts, { limit: 50 });
    return items.map((a): RevenueShareAlert => ({ contractId: a.contractId, driverId: a.driverId, unrecognized: a.montantNonReconnu, remaining: a.montantRestant, lastWithholdingAt: a.lastWithholdingDate, reasons: a.reasons }));
  }
  async withholdings(contractId: string) {
    const { items } = await http.get<{ items: Array<{ transactionId: string; amount: number; sourceType: string | null; date: string }> }>(API.contracts.withholdings(contractId), { limit: 50 });
    return items.map((w): Withholding => ({ id: w.transactionId, amount: w.amount, source: w.sourceType ?? "—", date: w.date }));
  }
  async switchToRevenueShare(contractId: string, rate: number) {
    await http.post(API.contracts.repaymentMode(contractId), { mode: "PAR_REVENU", taux: rate });
  }
  async updateRate(contractId: string, rate: number) {
    await http.patch(API.contracts.revenueShareRate(contractId), { taux: rate });
  }
  async unblockDriver(driverId: string) {
    await http.post(API.contracts.unblockDriver(driverId));
  }
}
