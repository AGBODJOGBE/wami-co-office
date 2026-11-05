/** Dotations de portefeuille : crédit en masse (bonus, geste commercial), demandé par un agent et approuvé par un autre. */

export type GrantStatus = "pending" | "approved" | "completed" | "partiallyFailed" | "rejected" | "cancelled";

export const GRANT_STATUS_LABELS: Record<GrantStatus, string> = {
  pending: "À approuver",
  approved: "Approuvée",
  completed: "Terminée",
  partiallyFailed: "Partiellement échouée",
  rejected: "Rejetée",
  cancelled: "Annulée",
};

export type GrantAudience = "DRIVER" | "PASSENGER";
export const GRANT_AUDIENCE_LABELS: Record<GrantAudience, string> = { DRIVER: "Chauffeurs", PASSENGER: "Passagers" };

export type GrantBalance = "MAIN" | "BONUS" | "REFERRAL";
export const GRANT_BALANCE_LABELS: Record<GrantBalance, string> = { MAIN: "Solde principal", BONUS: "Bonus", REFERRAL: "Parrainage" };

export interface Grant {
  id: string;
  label: string;
  audience: GrantAudience;
  balance: string;
  amountEach: number;
  beneficiaries: number;
  total: number;
  status: GrantStatus;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  credited: number;
  failed: number;
}

export interface GrantDraft {
  label: string;
  audience: GrantAudience;
  balance: GrantBalance;
  amountEach: number;
  /** Identifiants des bénéficiaires (un par ligne dans le formulaire). */
  beneficiaryIds: string[];
}

export interface GrantPreview {
  beneficiaries: number;
  total: number;
  unknownIds: string[];
  inOverdraft: number;
  absorbedByDebt: number;
  violations: string[];
  notes: string[];
}

export function draftBlocker(d: GrantDraft): string | null {
  if (d.label.trim().length < 3) return "Libellé obligatoire (3 caractères minimum).";
  if (!Number.isInteger(d.amountEach) || d.amountEach <= 0) return "Montant par bénéficiaire invalide.";
  if (d.beneficiaryIds.length === 0) return "Indiquez au moins un bénéficiaire.";
  if (new Set(d.beneficiaryIds).size !== d.beneficiaryIds.length) return "Un bénéficiaire est listé deux fois.";
  return null;
}

export function parseIds(text: string): string[] {
  return text.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
}

/** Principe des quatre yeux : on n'approuve pas sa propre demande. */
export function approveBlocker(g: Grant, actingId: string): string | null {
  if (g.status !== "pending") return "Seule une dotation à approuver peut l'être.";
  if (g.createdBy === actingId) return "Vous ne pouvez pas approuver votre propre demande.";
  return null;
}

export function rejectBlocker(g: Grant, reason: string, actingId: string): string | null {
  const b = approveBlocker(g, actingId);
  if (b) return b.replace("approuver", "rejeter").replace("l'être", "être rejetée");
  return reason.trim().length < 5 ? "Motif du rejet obligatoire (5 caractères minimum)." : null;
}

export function cancelBlocker(g: Grant): string | null {
  return g.status === "pending" || g.status === "approved" ? null : "Cette dotation ne peut plus être annulée.";
}

export function retryBlocker(g: Grant): string | null {
  return g.status === "partiallyFailed" ? null : "Aucune ligne échouée à relancer.";
}
