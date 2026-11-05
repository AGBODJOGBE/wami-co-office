/**
 * Plans d'abonnement des partenaires livraison (forfaits de livraisons).
 *
 * ⚠ Le backend stocke le prix en CENTIMES de FCFA (150 000 F = 15 000 000), seul module dans ce cas.
 * Tout le front raisonne en FCFA : la conversion est faite ici, dans `toCentimes` / `fromCentimes`.
 */

export const CENTIMES_PER_FCFA = 100;
export const toCentimes = (fcfa: number) => Math.round(fcfa * CENTIMES_PER_FCFA);
export const fromCentimes = (centimes: number) => centimes / CENTIMES_PER_FCFA;

export type QuotaPolicy = "BLOCK_NEW_ORDERS" | "BILL_PER_UNIT";
export const QUOTA_POLICY_LABELS: Record<QuotaPolicy, string> = {
  BLOCK_NEW_ORDERS: "Bloquer les nouvelles commandes",
  BILL_PER_UNIT: "Facturer à l'unité au-delà du quota",
};

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  /** null = livraisons illimitées. */
  quota: number | null;
  onQuotaExhausted: QuotaPolicy;
  /** Prix en FCFA. */
  price: number;
  active: boolean;
}

export type PlanDraft = Omit<Plan, "id" | "active">;

export function emptyPlan(): PlanDraft {
  return { name: "", description: null, durationDays: 30, quota: 100, onQuotaExhausted: "BLOCK_NEW_ORDERS", price: 0 };
}

export function planBlocker(d: PlanDraft, existing: Plan[], editingId?: string): string | null {
  if (d.name.trim().length < 2) return "Nom obligatoire.";
  if (existing.some((p) => p.id !== editingId && p.name.trim().toLowerCase() === d.name.trim().toLowerCase())) return "Un plan porte déjà ce nom.";
  if (!Number.isInteger(d.durationDays) || d.durationDays < 1) return "Durée : nombre de jours entier positif.";
  if (d.quota !== null && (!Number.isInteger(d.quota) || d.quota < 1)) return "Quota : entier positif, ou vide pour illimité.";
  if (!Number.isFinite(d.price) || d.price < 0 || !Number.isInteger(toCentimes(d.price))) return "Prix invalide.";
  return null;
}

export const deactivateBlocker = (p: Plan) => (p.active ? null : "Ce plan est déjà désactivé.");
export const reactivateBlocker = (p: Plan) => (p.active ? "Ce plan est déjà actif." : null);

/** Prix par livraison incluse, pour comparer les plans (null si illimité). */
export const pricePerDelivery = (p: Plan): number | null => (p.quota === null ? null : Math.round(p.price / p.quota));
