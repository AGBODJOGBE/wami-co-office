/**
 * Contrats de location-vente WAMI-CO : le chauffeur paie le véhicule par échéances
 * (journalières, hebdomadaires ou mensuelles) et en devient propriétaire une fois soldé.
 */

export type LeaseFrequency = "daily" | "weekly" | "monthly";
export const LEASE_FREQUENCY_LABELS: Record<LeaseFrequency, string> = { daily: "Journalière", weekly: "Hebdomadaire", monthly: "Mensuelle" };

export type LeaseStatus = "active" | "suspended" | "completed" | "broken";
export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = { active: "Actif", suspended: "Suspendu", completed: "Terminé", broken: "Rompu" };

export interface LeaseContract {
  id: string;
  driverId: string;
  driverName: string;
  vehicleLabel: string;
  plate: string;
  startDate: string;
  endDate: string;
  frequency: LeaseFrequency;
  installmentCount: number;
  installmentAmount: number;
  /** Prix total à rembourser (marge comprise). */
  totalAmount: number;
  downPayment: number;
  paid: number;
  remaining: number;
  /** Échéances impayées (le backend bloque le chauffeur à partir d'un seuil). */
  unpaidCount: number;
  status: LeaseStatus;
  repaymentMode: "schedule" | "revenueShare";
}

export interface LeaseInstallment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  paid: number;
  status: "pending" | "paid" | "unpaid" | "partial" | "cancelled" | "recovering";
}

export type LeaseHealth = "settled" | "upToDate" | "late" | "critical";

export const LEASE_HEALTH_LABELS: Record<LeaseHealth, string> = {
  settled: "Soldé",
  upToDate: "À jour",
  late: "En retard",
  critical: "Retard critique",
};

/** Retard critique : trois échéances impayées ou plus (seuil de blocage du chauffeur côté backend). */
export const CRITICAL_UNPAID = 3;

export const paidAmount = (c: LeaseContract) => c.paid;
export const remaining = (c: LeaseContract) => Math.max(0, c.remaining);

/** Montant en retard, estimé à partir du nombre d'échéances impayées. */
export const arrears = (c: LeaseContract) => Math.min(remaining(c), c.unpaidCount * c.installmentAmount);

export function health(c: LeaseContract): LeaseHealth {
  if (remaining(c) === 0) return "settled";
  if (c.unpaidCount === 0) return "upToDate";
  return c.unpaidCount >= CRITICAL_UNPAID ? "critical" : "late";
}

export type PaymentMethod = "cash" | "momo";

export function paymentBlocker(c: LeaseContract, amount: number, reference: string): string | null {
  if (c.status !== "active") return "Ce contrat n’est plus actif.";
  if (!Number.isInteger(amount) || amount <= 0) return "Montant invalide.";
  if (amount > remaining(c)) return "Le montant dépasse le reste à payer.";
  if (reference.trim().length === 0) return "Référence obligatoire (reçu ou numéro de transaction).";
  return null;
}

export function transitionBlocker(c: LeaseContract, action: "suspend" | "resume" | "break", reason: string): string | null {
  if (action === "resume" && c.status !== "suspended") return "Seul un contrat suspendu peut être repris.";
  if (action !== "resume" && c.status !== "active" && !(action === "break" && c.status === "suspended")) return "Ce contrat n’est pas actif.";
  if (action === "break" && reason.trim().length < 10) return "Motif de rupture obligatoire (10 caractères minimum).";
  return null;
}
