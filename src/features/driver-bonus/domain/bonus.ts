/**
 * Primes chauffeurs. Trois familles de configuration (une seule active par famille) :
 * - paliers : prime unique quand le chauffeur atteint un nombre de courses ;
 * - activité : prime journalière en % du net, selon le nombre de courses du jour ;
 * - qualité : prime mensuelle selon la note moyenne, au-dessus d'un minimum de courses.
 */

export type BonusFamily = "tier" | "activity" | "quality";

export const BONUS_FAMILY_LABELS: Record<BonusFamily, string> = {
  tier: "Paliers de courses",
  activity: "Activité journalière",
  quality: "Qualité mensuelle",
};

export interface BonusConfig {
  id: string;
  family: BonusFamily;
  name: string;
  description: string | null;
  vehicleCategory: string;
  active: boolean;
  /** Lignes lisibles : « 50 courses → 5 000 F », « 10 courses/jour → 2 % »… */
  rules: string[];
}

/** Ligne d'historique (prime attribuée, journal ou versement). */
export interface BonusEntry {
  id: string;
  driverId: string;
  date: string;
  label: string;
  amount: number;
}

export interface BonusRunConfig {
  welcomeBonusEnabled: boolean;
  activityBonusEnabled: boolean;
  qualityBonusEnabled: boolean;
  activityPayoutFrequency: string;
}

export type BonusLedger = "awards" | "activityLedger" | "activityPayouts" | "qualityLedger";

export const BONUS_LEDGER_LABELS: Record<BonusLedger, string> = {
  awards: "Primes de paliers",
  activityLedger: "Journal d’activité",
  activityPayouts: "Versements d’activité",
  qualityLedger: "Primes qualité",
};

export function activateBlocker(c: BonusConfig): string | null {
  return c.active ? "Cette configuration est déjà active." : null;
}

export function deactivateBlocker(c: BonusConfig): string | null {
  return c.active ? null : "Cette configuration n’est pas active.";
}

export function deleteBlocker(c: BonusConfig): string | null {
  return c.active ? "Désactivez la configuration avant de la supprimer." : null;
}
