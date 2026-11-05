/** Affiliation : configuration, création d'un profil, relevé de commissions et commissions non créées. */

export interface AffiliateConfig {
  /** Fraction entre 0 et 1 appliquée aux affiliés sans taux négocié. */
  defaultCommissionRate: number;
  minPayoutAmount: number;
}

export type Eligibility = "eligible" | "noAccount" | "noPassengerProfile" | "alreadyAffiliate";

export const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  eligible: "Éligible",
  noAccount: "Aucun compte WAMI avec ce numéro.",
  noPassengerProfile: "Ce compte n'a pas de profil passager.",
  alreadyAffiliate: "Cette personne est déjà affiliée.",
};

export interface EligibilityResult {
  status: Eligibility;
  displayName: string | null;
}

export interface NewAffiliate {
  phoneNumber: string;
  name: string;
  socialNetwork: string;
  audienceSize: number | null;
  /** Fraction entre 0 et 1 ; null = taux par défaut. */
  commissionRate: number | null;
}

export interface CommissionLine {
  id: string;
  source: string;
  amount: number;
  payable: number;
  paid: number;
  outstanding: number;
  rate: number;
  status: string;
  accruedAt: string;
  held: boolean;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface AffiliateStatement {
  totalAccrued: number;
  totalPaid: number;
  outstanding: number;
  heldOutstanding: number;
  walletBalance: number | null;
  breakdown: StatusBreakdown[];
  lines: CommissionLine[];
  suspensionReason: string | null;
}

export interface CommissionSkip {
  id: string;
  affiliateId: string;
  reason: string;
  source: string;
  platformCommission: number;
  potential: number | null;
  appliedAt: string;
  resolved: boolean;
}

export const SKIP_REASON_LABELS: Record<string, string> = {
  NEGATIVE_MARGIN: "Marge négative",
  ZERO_RATE: "Taux nul",
  ZERO_AMOUNT: "Montant nul",
  AFFILIATE_SUSPENDED: "Affilié suspendu",
  AFFILIATE_CLOSED: "Affilié clôturé",
};

export const skipReasonLabel = (r: string) => SKIP_REASON_LABELS[r] ?? r;

export function configBlocker(c: AffiliateConfig): string | null {
  if (!(c.defaultCommissionRate >= 0 && c.defaultCommissionRate <= 1)) return "Le taux par défaut doit être compris entre 0 % et 100 %.";
  if (!Number.isInteger(c.minPayoutAmount) || c.minPayoutAmount < 0) return "Montant minimum de retrait : entier positif (FCFA).";
  return null;
}

export function newAffiliateBlocker(a: NewAffiliate, eligibility: EligibilityResult | null): string | null {
  if (!/^\+?[0-9 ]{8,15}$/.test(a.phoneNumber.trim())) return "Numéro de téléphone invalide.";
  if (!eligibility) return "Vérifiez d'abord l'éligibilité du numéro.";
  if (eligibility.status !== "eligible") return ELIGIBILITY_LABELS[eligibility.status];
  if (a.name.trim().length < 2) return "Nom obligatoire.";
  if (a.socialNetwork.trim().length < 2) return "Réseau social obligatoire.";
  if (a.audienceSize !== null && (!Number.isInteger(a.audienceSize) || a.audienceSize < 0)) return "Audience : entier positif ou vide.";
  if (a.commissionRate !== null && !(a.commissionRate >= 0 && a.commissionRate <= 1)) return "Le taux doit être compris entre 0 % et 100 %.";
  return null;
}

/** Une commission déjà payée ou annulée ne peut plus être retenue ni annulée. */
const open = (l: CommissionLine) => l.status !== "PAID" && l.status !== "CANCELLED";

export function holdBlocker(l: CommissionLine, reason: string): string | null {
  if (!open(l)) return "Cette commission est déjà réglée ou annulée.";
  if (l.held) return "Cette commission est déjà retenue.";
  return reason.trim().length < 5 ? "Motif de retenue obligatoire (5 caractères minimum)." : null;
}

export function releaseBlocker(l: CommissionLine): string | null {
  return l.held ? null : "Cette commission n'est pas retenue.";
}

export function cancelCommissionBlocker(l: CommissionLine, reason: string): string | null {
  if (!open(l)) return "Cette commission est déjà réglée ou annulée.";
  return reason.trim().length < 5 ? "Motif d'annulation obligatoire (5 caractères minimum)." : null;
}
