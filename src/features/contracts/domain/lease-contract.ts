/**
 * Contrats de location-vente WAMI-CO : le chauffeur paie le véhicule par
 * versements hebdomadaires et en devient propriétaire une fois soldé.
 */

export interface LeasePayment {
  id: string;
  date: string;
  amount: number;
  method: "cash" | "momo" | "earnings";
}

export interface LeaseContract {
  id: string;
  driverName: string;
  vehicleLabel: string;
  plate: string;
  startDate: string;
  /** Prix total du véhicule (hors apport). */
  totalPrice: number;
  deposit: number;
  weeklyInstallment: number;
  weeks: number;
  payments: LeasePayment[];
  status: "active" | "completed" | "terminated";
}

export type LeaseHealth = "settled" | "upToDate" | "late" | "critical";

export const LEASE_HEALTH_LABELS: Record<LeaseHealth, string> = {
  settled: "Soldé",
  upToDate: "À jour",
  late: "En retard",
  critical: "Retard critique",
};

const WEEK_MS = 7 * 86_400_000;

export const paidAmount = (c: LeaseContract) => c.payments.reduce((s, p) => s + p.amount, 0);

/** Reste à payer sur le prix du véhicule. */
export const remaining = (c: LeaseContract) => Math.max(0, c.totalPrice - paidAmount(c));

export function weeksElapsed(c: LeaseContract, now: Date): number {
  return Math.max(0, Math.min(c.weeks, Math.floor((now.getTime() - new Date(c.startDate).getTime()) / WEEK_MS)));
}

/** Ce qui aurait dû être payé à date. */
export const expectedPaid = (c: LeaseContract, now: Date) => Math.min(c.totalPrice, weeksElapsed(c, now) * c.weeklyInstallment);

export const arrears = (c: LeaseContract, now: Date) => Math.max(0, expectedPaid(c, now) - paidAmount(c));

/** Retard critique : trois échéances ou plus (seuil à valider avec WAMI-CO). */
export function health(c: LeaseContract, now: Date): LeaseHealth {
  if (remaining(c) === 0) return "settled";
  const a = arrears(c, now);
  if (a === 0) return "upToDate";
  return a >= 3 * c.weeklyInstallment ? "critical" : "late";
}

export function paymentBlocker(c: LeaseContract, amount: number): string | null {
  if (c.status !== "active") return "Ce contrat n’est plus actif.";
  if (!Number.isInteger(amount) || amount <= 0) return "Montant invalide.";
  if (amount > remaining(c)) return `Le montant dépasse le reste à payer.`;
  return null;
}
