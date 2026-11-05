/** Comptes entreprises : livraisons facturées au mois, avec plafond de crédit. */

export interface B2bAccount {
  id: string;
  company: string;
  sector: string;
  contactName: string;
  contactPhone: string;
  creditLimit: number;
  /** Montant livré non encore payé. */
  outstanding: number;
  paymentTermDays: number;
  status: "active" | "suspended";
  monthDeliveries: number;
  monthAmount: number;
}

export interface Invoice {
  id: string;
  period: string;
  amount: number;
  dueAt: string;
  status: "paid" | "due" | "overdue";
}

export const availableCredit = (a: B2bAccount) => Math.max(0, a.creditLimit - a.outstanding);

/** Part du plafond utilisée (0 à 1+). */
export const creditUsage = (a: B2bAccount) => (a.creditLimit ? a.outstanding / a.creditLimit : 1);

/** Le nouveau plafond ne peut pas être sous l'encours, et se règle par tranches de 10 000 F. */
export function creditLimitBlocker(a: B2bAccount, newLimit: number): string | null {
  if (!Number.isFinite(newLimit) || newLimit <= 0) return "Plafond invalide.";
  if (newLimit % 10_000 !== 0) return "Le plafond se règle par tranches de 10 000 F.";
  if (newLimit < a.outstanding) return "Le plafond ne peut pas être inférieur à l’encours actuel.";
  return null;
}
