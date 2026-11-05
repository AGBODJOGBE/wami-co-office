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

/** Programme simple « récompense parrain / filleul » : route absente du backend (faux backend). */
export interface ReferralProgram {
  active: boolean;
  referrerReward: number;
  refereeReward: number;
  /** Missions que le filleul doit terminer pour débloquer les récompenses. */
  requiredMissions: number;
}

export function programBlocker(p: ReferralProgram): string | null {
  for (const v of [p.referrerReward, p.refereeReward]) {
    if (!Number.isInteger(v) || v < 0 || v > 5000) return "Récompenses entre 0 et 5 000 F.";
  }
  if (!Number.isInteger(p.requiredMissions) || p.requiredMissions < 1 || p.requiredMissions > 10) return "Missions requises entre 1 et 10.";
  return null;
}
