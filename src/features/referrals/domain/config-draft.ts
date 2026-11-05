/** Brouillon d'une configuration de parrainage : matrice de récompenses 5×5, limites et conditions par profil. */

export const PROFILE_TYPES = ["PASSENGER", "DRIVER_STANDARD", "DRIVER_PREMIUM", "DRIVER_VIP", "PARTNER"] as const;
export type ProfileType = (typeof PROFILE_TYPES)[number];

export const PROFILE_LABELS: Record<ProfileType, string> = {
  PASSENGER: "Passager",
  DRIVER_STANDARD: "Chauffeur standard",
  DRIVER_PREMIUM: "Chauffeur premium",
  DRIVER_VIP: "Chauffeur VIP",
  PARTNER: "Partenaire",
};

export type RewardMode = "FIXED" | "PERCENTAGE";
export type ActionType = "RIDE" | "TRANSACTION" | "DELIVERY";
export const ACTION_LABELS: Record<ActionType, string> = { RIDE: "courses", TRANSACTION: "transactions", DELIVERY: "livraisons" };

export interface RuleDraft {
  referrerType: ProfileType;
  referredType: ProfileType;
  mode: RewardMode;
  /** FCFA entier (FIXED) ou pourcentage 0-100 (PERCENTAGE). */
  referrerAmount: number;
  referredAmount: number;
  /** Plafonds en FCFA, pour le mode pourcentage seulement ; null = sans plafond. */
  referrerCap: number | null;
  referredCap: number | null;
}

export interface LimitDraft {
  referredType: ProfileType;
  maxPerMonth: number;
  maxPerDay: number;
}

export interface ConditionDraft {
  referredType: ProfileType;
  actionsRequired: number;
  actionType: ActionType;
}

export interface ConfigDraft {
  name: string;
  description: string;
  rules: RuleDraft[];
  limits: LimitDraft[];
  globalMaxPerDay: number | null;
  conditions: ConditionDraft[];
  expirationDays: number | null;
}

/** Brouillon de départ : mêmes récompenses fixes partout, limites et conditions prudentes. */
export function defaultDraft(): ConfigDraft {
  return {
    name: "",
    description: "",
    rules: PROFILE_TYPES.flatMap((referrerType) => PROFILE_TYPES.map((referredType): RuleDraft => ({ referrerType, referredType, mode: "FIXED", referrerAmount: 1000, referredAmount: 500, referrerCap: null, referredCap: null }))),
    limits: PROFILE_TYPES.map((referredType) => ({ referredType, maxPerMonth: 10, maxPerDay: 5 })),
    globalMaxPerDay: null,
    conditions: PROFILE_TYPES.map((referredType) => ({ referredType, actionsRequired: 1, actionType: "RIDE" as const })),
    expirationDays: 30,
  };
}

/** Applique à toutes les cases la récompense d'une case de référence. */
export function fillMatrix(rules: RuleDraft[], from: RuleDraft): RuleDraft[] {
  return rules.map((r) => ({ ...r, mode: from.mode, referrerAmount: from.referrerAmount, referredAmount: from.referredAmount, referrerCap: from.referrerCap, referredCap: from.referredCap }));
}

const posInt = (n: number) => Number.isInteger(n) && n >= 1;

function ruleBlocker(r: RuleDraft): string | null {
  const where = `${PROFILE_LABELS[r.referrerType]} → ${PROFILE_LABELS[r.referredType]}`;
  if (r.mode === "FIXED") {
    if (![r.referrerAmount, r.referredAmount].every((v) => Number.isInteger(v) && v >= 0)) return `${where} : montants entiers positifs (FCFA).`;
    return null;
  }
  if (![r.referrerAmount, r.referredAmount].every((v) => v >= 0 && v <= 100)) return `${where} : pourcentage entre 0 et 100.`;
  for (const cap of [r.referrerCap, r.referredCap]) if (cap !== null && !posInt(cap)) return `${where} : plafond entier positif ou vide.`;
  return null;
}

export function draftBlocker(d: ConfigDraft): string | null {
  if (d.name.trim().length < 3) return "Nom obligatoire (3 caractères minimum).";
  if (d.rules.length !== PROFILE_TYPES.length ** 2) return "La matrice doit couvrir les 25 combinaisons de profils.";
  for (const r of d.rules) {
    const b = ruleBlocker(r);
    if (b) return b;
  }
  for (const l of d.limits) {
    if (!posInt(l.maxPerMonth) || !posInt(l.maxPerDay)) return `${PROFILE_LABELS[l.referredType]} : limites par jour et par mois = entiers positifs.`;
    if (l.maxPerDay > l.maxPerMonth) return `${PROFILE_LABELS[l.referredType]} : la limite par jour dépasse celle du mois.`;
  }
  if (d.globalMaxPerDay !== null && !posInt(d.globalMaxPerDay)) return "Plafond global par jour : entier positif ou vide.";
  for (const c of d.conditions) if (!posInt(c.actionsRequired)) return `${PROFILE_LABELS[c.referredType]} : nombre d'actions requises = entier positif.`;
  if (d.expirationDays !== null && !posInt(d.expirationDays)) return "Expiration : nombre de jours entier positif ou vide.";
  return null;
}
