/** Demandes de retrait des portefeuilles (chauffeurs, partenaires, affiliés), à valider par un agent. */

export type WithdrawalStatus = "awaiting" | "pending" | "processing" | "completed" | "failed" | "cancelled" | "rejected";

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  awaiting: "À valider",
  pending: "En attente",
  processing: "En cours",
  completed: "Terminé",
  failed: "Échoué",
  cancelled: "Annulé",
  rejected: "Rejeté",
};

export interface Withdrawal {
  id: string;
  walletId: string;
  ownerName: string;
  phone: string;
  amount: number;
  method: string;
  /** Destinataire lisible : numéro Mobile Money ou compte bancaire. */
  recipient: string;
  status: WithdrawalStatus;
  /** Sous-solde débité : un retrait « AFFILIATE » est un retrait de commissions. */
  source: string;
  reference: string | null;
  failureReason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  affiliateOutstanding: number | null;
}

export const isAwaiting = (w: Withdrawal) => w.status === "awaiting";

export function approveBlocker(w: Withdrawal): string | null {
  return isAwaiting(w) ? null : "Seul un retrait à valider peut être approuvé.";
}

export function rejectBlocker(w: Withdrawal, reason: string): string | null {
  if (!isAwaiting(w)) return "Seul un retrait à valider peut être rejeté.";
  if (reason.trim().length < 5) return "Motif du rejet obligatoire (5 caractères minimum).";
  return null;
}
