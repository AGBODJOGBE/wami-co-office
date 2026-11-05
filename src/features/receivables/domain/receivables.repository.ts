import type { CommissionDebts, DebtLine, PlatformRevenue, ReceivablesOverview } from "./receivables";

export interface ReceivablesRepository {
  revenue(from?: string, to?: string): Promise<PlatformRevenue>;
  overview(): Promise<ReceivablesOverview>;
  debts(): Promise<CommissionDebts>;
  debtLines(driverId: string): Promise<DebtLine[]>;
}
