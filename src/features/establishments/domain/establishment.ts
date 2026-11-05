/**
 * Établissements partenaires (WAMI Business). Le back-office supervise :
 * menu, prix et planning restent gérés par l'établissement dans son app.
 */

export type Activity = "restaurant" | "hotel" | "rooms" | "landlord" | "bus";

export const ACTIVITY_LABELS: Record<Activity, string> = {
  restaurant: "Restaurant",
  hotel: "Hôtel",
  rooms: "Chambres",
  landlord: "Propriétaire",
  bus: "Compagnie de bus",
};

export type EstablishmentStatus = "open" | "paused" | "verifying" | "suspended";

export const ESTABLISHMENT_STATUS_LABELS: Record<EstablishmentStatus, string> = {
  open: "Ouvert",
  paused: "En pause",
  verifying: "En vérification",
  suspended: "Suspendu",
};

export interface Establishment {
  id: string;
  name: string;
  activity: Activity;
  district: string;
  status: EstablishmentStatus;
  ownerName: string;
  ownerPhone: string;
  since: string;
  /** Taux négocié ; `null` = taux par défaut de l'activité. */
  commissionRate: number | null;
  defaultCommissionRate: number;
  rating: number | null;
  sales30d: number;
  /** Part des demandes refusées sur 30 jours. */
  rejectionRate: number;
  payout: string;
}

export const effectiveRate = (e: Establishment) => e.commissionRate ?? e.defaultCommissionRate;

/** Un taux de refus élevé dégrade l'expérience client. Seuil à valider. */
export const highRejection = (e: Establishment) => e.rejectionRate >= 0.15;

export function commissionBlocker(rate: number | null): string | null {
  if (rate === null) return null;
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.3) return "Commission entre 0 et 30 %.";
  return null;
}

export function suspendBlocker(e: Establishment, reason: string): string | null {
  if (e.status === "suspended") return "Déjà suspendu.";
  if (reason.trim().length < 10) return "Motif obligatoire (10 caractères minimum).";
  return null;
}
