/**
 * Affiliation : influenceurs et apporteurs dont le code promo génère une commission.
 * Les commissions s'accumulent dans le sous-solde AFFILIATE du portefeuille ; le versement
 * passe par une demande de retrait, validée dans l'écran Portefeuilles.
 */

export type AffiliateStatus = "active" | "suspended" | "closed";

export const AFFILIATE_STATUS_LABELS: Record<AffiliateStatus, string> = { active: "Actif", suspended: "Suspendu", closed: "Clôturé" };

export interface AffiliateCode {
  code: string;
  usages: number;
  usable: boolean;
}

export interface Affiliate {
  id: string;
  name: string;
  phone: string;
  socialNetwork: string;
  audienceSize: number | null;
  status: AffiliateStatus;
  /** Taux négocié ; null = taux par défaut de la plateforme. */
  commissionRate: number | null;
  effectiveCommissionRate: number;
  /** Commissions gagnées au total. */
  accrued: number;
  paid: number;
  /** Reste à verser. */
  outstanding: number;
  codes: AffiliateCode[];
}

export type SuspensionMode = "pause" | "sanction";

export function suspendBlocker(a: Affiliate, mode: SuspensionMode, reason: string): string | null {
  if (a.status !== "active") return "Seul un affilié actif peut être suspendu.";
  if (mode === "sanction" && reason.trim().length < 5) return "Motif obligatoire pour une sanction.";
  return null;
}

export function reactivateBlocker(a: Affiliate): string | null {
  return a.status === "suspended" ? null : "Seul un affilié suspendu peut être réactivé.";
}

export function closeBlocker(a: Affiliate, reason: string): string | null {
  if (a.status === "closed") return "Profil déjà clôturé.";
  if (reason.trim().length < 5) return "Motif de clôture obligatoire.";
  return null;
}

export function reopenBlocker(a: Affiliate, reason: string): string | null {
  if (a.status !== "closed") return "Seul un profil clôturé peut être rouvert.";
  if (reason.trim().length < 5) return "Motif de réouverture obligatoire.";
  return null;
}

/** Taux de commission : fraction entre 0 et 1, ou null pour revenir au taux par défaut. */
export function rateBlocker(rate: number | null): string | null {
  if (rate === null) return null;
  if (!(rate >= 0 && rate <= 1)) return "Le taux doit être compris entre 0 % et 100 %.";
  return null;
}

/** Montant minimum d'un versement direct (à valider). Route absente du backend : faux backend. */
export const MIN_AFFILIATE_PAYOUT = 5000;

export function payoutBlocker(a: Affiliate, amount: number): string | null {
  if (a.status !== "active") return "Affilié non actif.";
  if (!Number.isInteger(amount) || amount <= 0) return "Montant invalide.";
  if (amount > a.outstanding) return "Le montant dépasse ce qui est dû.";
  if (amount < MIN_AFFILIATE_PAYOUT) return `Versement minimum : ${MIN_AFFILIATE_PAYOUT} F.`;
  return null;
}
