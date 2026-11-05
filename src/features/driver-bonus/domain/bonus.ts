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

export const BONUS_VEHICLE_CATEGORIES = ["ALL", "MOTO", "TRICYCLE", "ECO", "STANDARD", "CONFORT", "VAN", "VIP"] as const;

/** Palier en cours d'édition. `threshold` : courses (paliers), courses par jour (activité) ou note minimale (qualité) ; `value` : FCFA ou % du net (activité). */
export interface TierDraft {
  name: string;
  threshold: number;
  value: number;
}

export interface BonusDraft {
  family: BonusFamily;
  name: string;
  description: string;
  vehicleCategory: string;
  /** Qualité seulement. */
  minRidesPerMonth: number;
  tiers: TierDraft[];
}

export const emptyDraft = (family: BonusFamily): BonusDraft => ({ family, name: "", description: "", vehicleCategory: "ALL", minRidesPerMonth: 100, tiers: [{ name: family === "activity" ? "Bronze" : "", threshold: family === "quality" ? 4.5 : 10, value: family === "activity" ? 2 : 5000 }] });

export const TIER_LABELS: Record<BonusFamily, { threshold: string; value: string }> = {
  tier: { threshold: "Courses à atteindre", value: "Prime (F)" },
  activity: { threshold: "Courses par jour", value: "Prime (% du net)" },
  quality: { threshold: "Note minimale", value: "Prime (F)" },
};

export function draftBlocker(d: BonusDraft): string | null {
  if (d.name.trim().length < 3) return "Nom obligatoire (3 caractères minimum).";
  if (!(BONUS_VEHICLE_CATEGORIES as readonly string[]).includes(d.vehicleCategory)) return "Catégorie de véhicule inconnue.";
  if (d.tiers.length === 0) return "Ajoutez au moins un palier.";
  const thresholds = d.tiers.map((t) => t.threshold);
  if (new Set(thresholds).size !== thresholds.length) return "Deux paliers ont le même seuil.";
  for (const t of d.tiers) {
    if (d.family === "quality") {
      if (!(t.threshold >= 0 && t.threshold <= 5)) return "La note minimale est comprise entre 0 et 5.";
    } else if (!Number.isInteger(t.threshold) || t.threshold < 1) return "Les seuils de courses sont des entiers positifs.";
    if (d.family === "activity") {
      if (t.name.trim().length === 0) return "Chaque palier d'activité porte un nom.";
      if (!(t.value > 0 && t.value <= 100)) return "Le pourcentage est compris entre 0 et 100.";
    } else if (!Number.isInteger(t.value) || t.value < 0) return "Les primes sont des montants entiers positifs (FCFA).";
  }
  if (d.family === "quality" && (!Number.isInteger(d.minRidesPerMonth) || d.minRidesPerMonth < 1)) return "Courses minimales par mois : entier positif.";
  return null;
}

export interface BonusConfig {
  id: string;
  family: BonusFamily;
  name: string;
  description: string | null;
  vehicleCategory: string;
  active: boolean;
  /** Lignes lisibles : « 50 courses → 5 000 F », « 10 courses/jour → 2 % »… */
  rules: string[];
  /** Contenu complet, pour l'édition. */
  draft: BonusDraft;
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
