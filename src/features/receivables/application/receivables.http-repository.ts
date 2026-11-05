import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { CommissionDebts, DebtLine, OutflowLine, PlatformRevenue, ReceivablesOverview, RevenueLine } from "../domain/receivables";
import type { ReceivablesRepository } from "../domain/receivables.repository";

export interface BackendRevenue {
  balance: number;
  totalRevenue: number;
  netResult: number;
  breakdown: RevenueLine[];
  outflows: { breakdown: OutflowLine[]; total: number };
}

export interface BackendReceivables {
  drivers: Array<{ driverId: string; driverName: string; contractReceivable: number; commissionReceivable: number; totalReceivable: number; oldestReceivableAt: string | null }>;
  totals: { contractReceivable: number; commissionReceivable: number; totalReceivable: number };
}

export interface BackendDebts {
  drivers: Array<{ driverId: string; walletId: string; driverName: string; driverPhone: string; driverStatus: string; debtAmount: number }>;
  totalDebtAmount: number;
}

export const toRevenue = (r: BackendRevenue): PlatformRevenue => ({
  balance: r.balance,
  totalRevenue: r.totalRevenue,
  outflows: r.outflows.total,
  net: r.netResult,
  breakdown: r.breakdown.filter((b) => b.label),
  outflowBreakdown: r.outflows.breakdown,
});

export const toOverview = (r: BackendReceivables): ReceivablesOverview => ({
  rows: r.drivers.map((d) => ({ driverId: d.driverId, driverName: d.driverName || "—", contract: d.contractReceivable, commission: d.commissionReceivable, total: d.totalReceivable, oldestAt: d.oldestReceivableAt })),
  contract: r.totals.contractReceivable,
  commission: r.totals.commissionReceivable,
  total: r.totals.totalReceivable,
});

export const toDebts = (r: BackendDebts): CommissionDebts => ({
  rows: r.drivers.map((d) => ({ driverId: d.driverId, walletId: d.walletId, driverName: d.driverName || "—", phone: d.driverPhone, status: d.driverStatus, amount: d.debtAmount })),
  total: r.totalDebtAmount,
});

export class HttpReceivablesRepository implements ReceivablesRepository {
  async revenue(from?: string, to?: string) {
    return toRevenue(await http.get<BackendRevenue>(API.wallet.platformRevenue, { fromDate: from, toDate: to }));
  }
  async overview() {
    return toOverview(await http.get<BackendReceivables>(API.wallet.receivables, { limit: 100 }));
  }
  async debts() {
    return toDebts(await http.get<BackendDebts>(API.wallet.commissionDebts, { limit: 100 }));
  }
  async debtLines(driverId: string) {
    const r = await http.get<{ items: Array<{ transactionId: string; source: string; entityNumber: string; commissionAmount: number; description: string; date: string }> }>(API.wallet.driverCommissionDebts(driverId), { limit: 50 });
    return r.items.map((i): DebtLine => ({ id: i.transactionId, source: i.source, number: i.entityNumber, amount: i.commissionAmount, description: i.description, date: i.date }));
  }
}
