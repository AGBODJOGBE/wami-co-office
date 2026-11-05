/**
 * Affiliation : apporteurs d'affaires (personnes ou agences) rémunérés pour
 * chaque partenaire recruté qui devient actif.
 */

export interface Affiliate {
  id: string;
  name: string;
  kind: "individual" | "agency";
  phone: string;
  code: string;
  /** Partenaires recrutés devenus actifs. */
  activations: number;
  /** Partenaires recrutés encore en vérification. */
  pending: number;
  ratePerActivation: number;
  paid: number;
  status: "active" | "suspended";
}

export const earned = (a: Affiliate) => a.activations * a.ratePerActivation;
export const due = (a: Affiliate) => Math.max(0, earned(a) - a.paid);

/** Montant minimum d'un versement à un affilié (à valider). */
export const MIN_AFFILIATE_PAYOUT = 5000;

export function payoutBlocker(a: Affiliate, amount: number): string | null {
  if (a.status !== "active") return "Affilié suspendu.";
  if (!Number.isInteger(amount) || amount <= 0) return "Montant invalide.";
  if (amount > due(a)) return "Le montant dépasse ce qui est dû.";
  if (amount < MIN_AFFILIATE_PAYOUT) return `Versement minimum : ${MIN_AFFILIATE_PAYOUT} F.`;
  return null;
}
