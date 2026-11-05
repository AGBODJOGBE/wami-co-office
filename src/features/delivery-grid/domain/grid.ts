/**
 * Grille tarifaire des livraisons (B2B et colis). Une grille est versionnée et immuable :
 * modifier une grille, c'est en publier une nouvelle version, qui remplace aussitôt la grille active.
 */

export const PARCEL_CATEGORIES = ["COURRIER", "PETIT_COLIS", "COLIS_MOYEN", "COLIS_VOLUMINEUX", "FRAGILE", "HAUTE_VALEUR", "PERISSABLE"] as const;
export type ParcelCategory = (typeof PARCEL_CATEGORIES)[number];

export const PARCEL_LABELS: Record<ParcelCategory, string> = {
  COURRIER: "Courrier",
  PETIT_COLIS: "Petit colis",
  COLIS_MOYEN: "Colis moyen",
  COLIS_VOLUMINEUX: "Colis volumineux",
  FRAGILE: "Fragile",
  HAUTE_VALEUR: "Haute valeur",
  PERISSABLE: "Périssable",
};

export interface ZoneFee {
  origin: string;
  destination: string;
  fee: number;
}

export interface DistanceRange {
  minKm: number;
  /** null = sans limite haute. */
  maxKm: number | null;
  fee: number;
}

export interface Grid {
  id: string;
  version: string;
  active: boolean;
  baseFees: Record<ParcelCategory, number>;
  fragileSurcharge: number;
  zones: ZoneFee[];
  distanceRanges: DistanceRange[];
  weightSurchargePerKg: number;
  expressMultiplier: number;
  sameDayMultiplier: number;
  /** Fractions entre 0 et 1. */
  insuranceRate: number;
  insuranceMinimum: number;
  codFeeRate: number;
  codFeeMinimum: number;
  activatedAt: string | null;
}

export type GridDraft = Omit<Grid, "id" | "active" | "activatedAt">;

/** Brouillon d'une nouvelle version, copié de la grille active (version vide à renseigner). */
export function draftFrom(g: Grid): GridDraft {
  const { id: _id, active: _a, activatedAt: _t, ...rest } = g;
  void _id; void _a; void _t;
  return { ...rest, version: "", baseFees: { ...g.baseFees }, zones: g.zones.map((z) => ({ ...z })), distanceRanges: g.distanceRanges.map((r) => ({ ...r })) };
}

const nonNeg = (n: number) => Number.isFinite(n) && n >= 0;

export function gridBlocker(d: GridDraft, existingVersions: string[]): string | null {
  const version = d.version.trim();
  if (!/^[\w.-]{2,30}$/.test(version)) return "Version : 2 à 30 caractères (lettres, chiffres, point, tiret).";
  if (existingVersions.includes(version)) return `La version « ${version} » existe déjà.`;
  if (!PARCEL_CATEGORIES.every((c) => nonNeg(d.baseFees[c]))) return "Chaque catégorie de colis a un tarif de base positif ou nul.";
  if (!nonNeg(d.fragileSurcharge)) return "Supplément fragile : montant positif ou nul.";
  if (d.zones.length === 0) return "Ajoutez au moins un tarif de zone.";
  if (d.zones.some((z) => !z.origin.trim() || !z.destination.trim())) return "Chaque tarif de zone indique l'origine et la destination.";
  if (d.zones.some((z) => !nonNeg(z.fee))) return "Un tarif de zone ne peut pas être négatif.";
  const pairs = d.zones.map((z) => `${z.origin.trim().toUpperCase()}>${z.destination.trim().toUpperCase()}`);
  if (new Set(pairs).size !== pairs.length) return "Deux tarifs de zone ont la même origine et la même destination.";
  if (d.distanceRanges.length === 0) return "Ajoutez au moins une tranche de distance.";
  for (const r of d.distanceRanges) {
    if (!nonNeg(r.minKm) || !nonNeg(r.fee)) return "Les tranches de distance sont positives.";
    if (r.maxKm !== null && r.maxKm <= r.minKm) return "Dans une tranche, la fin doit dépasser le début.";
  }
  const sorted = [...d.distanceRanges].sort((a, b) => a.minKm - b.minKm);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    if (prev.maxKm === null || prev.maxKm > sorted[i]!.minKm) return "Les tranches de distance se chevauchent.";
  }
  if (!nonNeg(d.weightSurchargePerKg)) return "Supplément au kilo : positif ou nul.";
  if (d.expressMultiplier < 1 || d.sameDayMultiplier < 1) return "Les coefficients d'urgence valent au moins 1.";
  for (const r of [d.insuranceRate, d.codFeeRate]) if (!(r >= 0 && r <= 1)) return "Les taux d'assurance et de paiement à la livraison sont compris entre 0 % et 100 %.";
  if (!nonNeg(d.insuranceMinimum) || !nonNeg(d.codFeeMinimum)) return "Les minimums d'assurance et de frais sont positifs ou nuls.";
  return null;
}

/** Écarts entre deux grilles, lisibles : ce qui change si l'on publie la nouvelle version. */
export function changes(active: Grid, d: GridDraft): string[] {
  const out: string[] = [];
  for (const c of PARCEL_CATEGORIES) if (active.baseFees[c] !== d.baseFees[c]) out.push(`${PARCEL_LABELS[c]} : ${active.baseFees[c]} → ${d.baseFees[c]} F`);
  if (active.fragileSurcharge !== d.fragileSurcharge) out.push(`Supplément fragile : ${active.fragileSurcharge} → ${d.fragileSurcharge} F`);
  if (active.weightSurchargePerKg !== d.weightSurchargePerKg) out.push(`Supplément au kilo : ${active.weightSurchargePerKg} → ${d.weightSurchargePerKg} F`);
  if (active.expressMultiplier !== d.expressMultiplier) out.push(`Express : ×${active.expressMultiplier} → ×${d.expressMultiplier}`);
  if (active.sameDayMultiplier !== d.sameDayMultiplier) out.push(`Jour même : ×${active.sameDayMultiplier} → ×${d.sameDayMultiplier}`);
  if (active.insuranceRate !== d.insuranceRate) out.push(`Assurance : ${active.insuranceRate * 100} % → ${d.insuranceRate * 100} %`);
  if (active.codFeeRate !== d.codFeeRate) out.push(`Paiement à la livraison : ${active.codFeeRate * 100} % → ${d.codFeeRate * 100} %`);
  if (active.zones.length !== d.zones.length) out.push(`Tarifs de zone : ${active.zones.length} → ${d.zones.length}`);
  if (active.distanceRanges.length !== d.distanceRanges.length) out.push(`Tranches de distance : ${active.distanceRanges.length} → ${d.distanceRanges.length}`);
  return out;
}
