/** Types de colis proposés au client (choix visuel, pas de pesée). */

export type ParcelVehicle = "moto" | "tricycle" | "van";

export interface ParcelType {
  code: string;
  label: string;
  description: string;
  maxWeightKg: number;
  maxSizeCm: number;
  vehicles: ParcelVehicle[];
  /** Multiplicateur appliqué au tarif colis de la zone. */
  priceMultiplier: number;
  active: boolean;
}

export function parcelTypeBlocker(t: ParcelType, all: ParcelType[], isNew: boolean): string | null {
  if (!/^[A-Z]{1,3}$/.test(t.code)) return "Code : 1 à 3 lettres majuscules (ex. S, M, L).";
  if (isNew && all.some((x) => x.code === t.code)) return "Ce code existe déjà.";
  if (t.label.trim().length < 2) return "Libellé obligatoire.";
  if (t.maxWeightKg <= 0 || t.maxWeightKg > 500) return "Poids maximum entre 1 et 500 kg.";
  if (t.maxSizeCm <= 0 || t.maxSizeCm > 300) return "Dimension maximum entre 1 et 300 cm.";
  if (t.vehicles.length === 0) return "Choisissez au moins un véhicule.";
  if (t.priceMultiplier < 0.5 || t.priceMultiplier > 5) return "Multiplicateur de prix entre 0,5 et 5.";
  const others = all.filter((x) => x.code !== t.code && x.active);
  if (t.active && others.some((x) => x.maxWeightKg === t.maxWeightKg)) return "Deux types actifs ne peuvent pas avoir le même poids maximum.";
  return null;
}
