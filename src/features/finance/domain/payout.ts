/**
 * Finances : lot de versement hebdomadaire aux partenaires et établissements.
 * Double validation : celui qui prépare le lot ne peut pas l'approuver.
 */

export interface FinanceSummary {
  collected: number;
  commission: number;
  toPay: number;
  cashCommissionDue: number;
  cashCommissionDebtors: number;
  refunds: number;
}

export type PayoutLineStatus = "ready" | "failed" | "negative";

export interface PayoutLine {
  id: string;
  beneficiary: string;
  type: "pro" | "establishment";
  sales: number;
  commission: number;
  /** Remboursements, commission due sur espèces, primes… (négatif = retenue). */
  adjustments: number;
  method: string;
  status: PayoutLineStatus;
  failureReason: string | null;
}

export interface PayoutBatch {
  id: string;
  payoutDate: string;
  status: "draft" | "submitted" | "approved" | "paid";
  preparedBy: string | null;
  approvedBy: string | null;
  lines: PayoutLine[];
  selectedIds: string[];
}

export const net = (l: PayoutLine) => l.sales - l.commission + l.adjustments;

/** Une ligne n'est versable que si elle est prête et positive. */
export const isPayable = (l: PayoutLine) => l.status === "ready" && net(l) > 0;

export function selectionTotal(b: PayoutBatch, ids: string[]): number {
  return b.lines.filter((l) => ids.includes(l.id) && isPayable(l)).reduce((s, l) => s + net(l), 0);
}

export function submitBlocker(b: PayoutBatch, ids: string[]): string | null {
  if (b.status !== "draft") return "Ce lot a déjà été soumis.";
  const payable = b.lines.filter((l) => ids.includes(l.id));
  if (payable.length === 0) return "Sélectionnez au moins un bénéficiaire.";
  if (payable.some((l) => !isPayable(l))) return "La sélection contient une ligne en échec ou négative.";
  return null;
}

export function approveBlocker(b: PayoutBatch, agentId: string): string | null {
  if (b.status !== "submitted") return "Le lot doit d’abord être soumis.";
  if (b.preparedBy === agentId) return "Double validation : une autre personne doit approuver ce lot.";
  return null;
}
