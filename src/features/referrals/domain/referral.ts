/** Parrainage : un utilisateur invite un proche, les deux sont récompensés selon la configuration active. */

export type ReferralStatus = "pending" | "validated" | "expired";
export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = { pending: "En attente", validated: "Validé", expired: "Expiré" };

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  /** Type de profil invité (passager, chauffeur, partenaire…). */
  type: string;
  status: ReferralStatus;
  referrerReward: number;
  refereeReward: number;
  validatedAt: string | null;
  createdAt: string;
}

export interface ReferralStats {
  total: number;
  validated: number;
  pending: number;
  expired: number;
  totalRewards: number;
}

export interface RewardRule {
  referrerType: string;
  referredType: string;
  mode: "fixed" | "percentage";
  referrerAmount: number;
  referredAmount: number;
}

export interface ReferralConfig {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  expirationDays: number | null;
  rules: RewardRule[];
  activatedAt: string | null;
}

export function validateBlocker(r: Referral): string | null {
  return r.status === "pending" ? null : "Seul un parrainage en attente peut être validé ou expiré.";
}

/** Une configuration ne peut être supprimée tant qu'elle est active. */
export function deleteBlocker(c: ReferralConfig): string | null {
  return c.active ? "Désactivez la configuration avant de la supprimer." : null;
}

export function activateBlocker(c: ReferralConfig): string | null {
  return c.active ? "Cette configuration est déjà active." : null;
}
