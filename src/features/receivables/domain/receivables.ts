/** Revenus de la plateforme, sommes dues par les chauffeurs (contrats, commissions) et dettes de commission. */

export interface RevenueLine {
  source: string;
  label: string;
  total: number;
}

export interface OutflowLine extends RevenueLine {
  category: string;
}

export interface PlatformRevenue {
  balance: number;
  totalRevenue: number;
  outflows: number;
  net: number;
  breakdown: RevenueLine[];
  outflowBreakdown: OutflowLine[];
}

export interface Receivable {
  driverId: string;
  driverName: string;
  contract: number;
  commission: number;
  total: number;
  oldestAt: string | null;
}

export interface ReceivablesOverview {
  rows: Receivable[];
  contract: number;
  commission: number;
  total: number;
}

export interface CommissionDebt {
  driverId: string;
  walletId: string;
  driverName: string;
  phone: string;
  status: string;
  amount: number;
}

export interface CommissionDebts {
  rows: CommissionDebt[];
  total: number;
}

export interface DebtLine {
  id: string;
  source: string;
  number: string;
  amount: number;
  description: string;
  date: string;
}

/** Âge en jours d'une créance (pour trier les relances). */
export function ageDays(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

/** Les sorties « dépense définitive » réduisent le résultat net ; les autres sont des mouvements de trésorerie. */
export const isDefinitive = (o: OutflowLine) => o.category === "DEFINITIVE_EXPENSE";
