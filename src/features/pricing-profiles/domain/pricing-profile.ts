/** Profils tarifaires (stratégie et composantes de calcul du prix) et zones de tarification du backend WAMI. */

export type Strategy = "PER_KM" | "PER_ZONE" | "FIXED" | "CATALOG";
export const STRATEGY_LABELS: Record<Strategy, string> = { PER_KM: "Au kilomètre", PER_ZONE: "Par zone", FIXED: "Prix fixe", CATALOG: "Catalogue de forfaits" };

export interface ProfileSummary {
  id: string;
  service: string;
  vehicleType: string | null;
  name: string;
  strategy: Strategy;
  active: boolean;
  version: number;
  updatedAt: string;
}

export interface ProfileComponent {
  type: string;
  label: string;
  /** Résumé lisible : valeur, paliers, zones, forfaits… */
  summary: string;
}

export interface ProfileDetail extends ProfileSummary {
  description: string | null;
  /** Fractions entre 0 et 1 ; leur somme vaut 1. */
  commissionRate: number;
  driverShareRate: number;
  components: ProfileComponent[];
}

export type ZoneType = "CITY" | "DISTRICT" | "NEIGHBORHOOD" | "CUSTOM";
export const ZONE_TYPE_LABELS: Record<ZoneType, string> = { CITY: "Ville", DISTRICT: "Arrondissement", NEIGHBORHOOD: "Quartier", CUSTOM: "Personnalisée" };

export interface PricingZone {
  id: string;
  service: string;
  code: string;
  name: string;
  type: ZoneType;
  active: boolean;
}

export interface ZoneDraft {
  service: string;
  code: string;
  name: string;
  type: ZoneType;
}

export function activateBlocker(p: ProfileSummary): string | null {
  return p.active ? "Ce profil est déjà actif." : null;
}

export function deactivateBlocker(p: ProfileSummary): string | null {
  return p.active ? null : "Ce profil n'est pas actif.";
}

/** Un profil actif sert au calcul des prix : on le désactive avant de le supprimer. */
export function deleteBlocker(p: ProfileSummary): string | null {
  return p.active ? "Désactivez le profil avant de le supprimer." : null;
}

export function shareBlocker(p: ProfileDetail): string | null {
  return Math.abs(p.commissionRate + p.driverShareRate - 1) < 1e-9 ? null : "Commission et part du chauffeur doivent totaliser 100 %.";
}

export function zoneBlocker(d: ZoneDraft, existing: PricingZone[]): string | null {
  if (!/^[A-Z0-9_]{2,20}$/.test(d.code.trim().toUpperCase())) return "Code : 2 à 20 lettres, chiffres ou _.";
  if (d.name.trim().length < 2) return "Nom obligatoire.";
  if (d.service.trim().length < 2) return "Service obligatoire.";
  if (existing.some((z) => z.service === d.service && z.code === d.code.trim().toUpperCase())) return "Ce code existe déjà pour ce service.";
  return null;
}
