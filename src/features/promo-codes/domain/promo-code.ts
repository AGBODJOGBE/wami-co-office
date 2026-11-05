/** Codes promo clients. */

export type PromoService = "ride" | "delivery" | "meal" | "bus" | "lodging";

export const PROMO_SERVICE_LABELS: Record<PromoService, string> = {
  ride: "Courses",
  delivery: "Colis",
  meal: "Repas",
  bus: "Bus",
  lodging: "Hébergement",
};

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  kind: "percent" | "fixed";
  /** Pourcentage (1-100) ou montant en F. */
  value: number;
  /** Remise maximale par utilisation (pour les pourcentages). */
  cap: number | null;
  maxUses: number;
  used: number;
  services: PromoService[];
  startsAt: string;
  endsAt: string;
  fundedBy: "wami" | "shared";
  firstOrderOnly: boolean;
  active: boolean;
}

export type PromoState = "scheduled" | "running" | "exhausted" | "ended" | "disabled";

export function promoState(p: PromoCode, now: Date): PromoState {
  if (!p.active) return "disabled";
  if (now < new Date(p.startsAt)) return "scheduled";
  if (now > new Date(p.endsAt)) return "ended";
  if (p.used >= p.maxUses) return "exhausted";
  return "running";
}

/** Remise appliquée à une commande. */
export function discount(p: PromoCode, orderAmount: number): number {
  const raw = p.kind === "percent" ? Math.round((orderAmount * p.value) / 100) : p.value;
  const capped = p.cap !== null ? Math.min(raw, p.cap) : raw;
  return Math.min(capped, orderAmount);
}

export function promoBlocker(p: PromoCode, existing: PromoCode[]): string | null {
  if (!/^[A-Z0-9]{4,16}$/.test(p.code)) return "Code : 4 à 16 lettres majuscules ou chiffres.";
  if (existing.some((x) => x.code === p.code)) return "Ce code existe déjà.";
  if (p.kind === "percent" && (p.value < 1 || p.value > 100)) return "Pourcentage entre 1 et 100.";
  if (p.kind === "fixed" && p.value < 100) return "Remise fixe : 100 F minimum.";
  if (p.kind === "percent" && p.cap === null) return "Un plafond est obligatoire pour une remise en pourcentage.";
  if (p.maxUses < 1) return "Nombre d’utilisations : au moins 1.";
  if (p.services.length === 0) return "Choisissez au moins un service.";
  if (new Date(p.endsAt) <= new Date(p.startsAt)) return "La fin doit être après le début.";
  return null;
}
