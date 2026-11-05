/** Paramètres système du backend (valeurs bornées) et versions minimales des applications mobiles. */

export interface SystemParam {
  key: string;
  label: string;
  module: string;
  description: string;
  value: string;
  display: string;
  unit: string | null;
  type: string;
  min: number | null;
  max: number | null;
  allowed: string[] | null;
  mustDivide: number | null;
  version: number;
  updatedBy: string;
  updatedAt: string;
  /** Valeur actuellement hors bornes (forcée par un super admin). */
  outOfBounds: boolean;
}

/** Violation des bornes d'une valeur proposée ; null si la valeur est dans les bornes. */
export function boundsViolation(p: SystemParam, value: string): string | null {
  if (p.allowed && p.allowed.length > 0) return p.allowed.includes(value) ? null : `Valeurs permises : ${p.allowed.join(", ")}.`;
  if (p.type === "NUMBER" || p.type === "INTEGER" || p.min !== null || p.max !== null) {
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n)) return "Valeur numérique attendue.";
    if (p.min !== null && n < p.min) return `Minimum : ${p.min}.`;
    if (p.max !== null && n > p.max) return `Maximum : ${p.max}.`;
    if (p.mustDivide !== null && n % p.mustDivide !== 0) return `Doit être un multiple de ${p.mustDivide}.`;
  }
  if (p.type === "BOOLEAN" && value !== "true" && value !== "false") return "Valeur attendue : true ou false.";
  return null;
}

export interface ParamEdit {
  value: string;
  force: boolean;
  justification: string;
}

export function paramBlocker(p: SystemParam, e: ParamEdit, isSuperAdmin: boolean): string | null {
  if (!isSuperAdmin) return "Seul un super admin peut modifier un paramètre système.";
  if (e.value === p.value) return "Aucune modification.";
  const violation = boundsViolation(p, e.value);
  if (violation === null) return null;
  if (!e.force) return `${violation} Cochez « forcer » et justifiez pour dépasser les bornes.`;
  if (e.justification.trim().length < 10) return "Justification obligatoire pour forcer (10 caractères minimum).";
  return null;
}

export interface AppVersion {
  id: string;
  appType: string;
  platform: string;
  packageId: string;
  latestVersion: string;
  latestBuild: number;
  minVersion: string;
  minBuild: number;
  forceUpdateAfter: string | null;
  downloadUrl: string;
  releaseNotes: string;
  updatedAt: string;
}

export type AppVersionDraft = Omit<AppVersion, "id" | "updatedAt">;

const SEMVER = /^\d+\.\d+\.\d+$/;

/** Compare deux versions « x.y.z » : négatif si a < b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function versionBlocker(d: AppVersionDraft): string | null {
  if (!SEMVER.test(d.latestVersion) || !SEMVER.test(d.minVersion)) return "Les versions s'écrivent x.y.z (ex. 1.4.0).";
  if (compareVersions(d.minVersion, d.latestVersion) > 0) return "La version minimale ne peut pas dépasser la dernière version.";
  if (![d.latestBuild, d.minBuild].every((n) => Number.isInteger(n) && n >= 0)) return "Les numéros de build sont des entiers positifs.";
  if (d.minBuild > d.latestBuild) return "Le build minimal ne peut pas dépasser le dernier build.";
  if (d.packageId.trim().length < 3) return "Identifiant de l'application obligatoire.";
  if (!/^https?:\/\//.test(d.downloadUrl.trim())) return "Lien de téléchargement invalide (http ou https).";
  if (d.forceUpdateAfter !== null && Number.isNaN(Date.parse(d.forceUpdateAfter))) return "Date de mise à jour forcée invalide.";
  return null;
}

/** Un changement qui relève la version minimale oblige les utilisateurs en retard à mettre à jour. */
export const raisesMinimum = (before: AppVersion, after: AppVersionDraft) => compareVersions(after.minVersion, before.minVersion) > 0 || after.minBuild > before.minBuild;
