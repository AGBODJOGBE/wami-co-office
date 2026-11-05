/** Livraisons grand public : colis et repas. */

export type DeliveryType = "parcel" | "meal";

export type DeliveryStatus = "searching" | "pickup" | "inTransit" | "delivered" | "cancelled" | "failed";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  searching: "Recherche livreur",
  pickup: "Collecte",
  inTransit: "En route",
  delivered: "Livrée",
  cancelled: "Annulée",
  failed: "Échec",
};

export interface Delivery {
  id: string;
  type: DeliveryType;
  status: DeliveryStatus;
  /** Type de colis (code) ou restaurant. */
  detail: string;
  senderName: string;
  recipientName: string;
  courierName: string | null;
  from: string;
  to: string;
  price: number;
  cashToCollect: number;
  createdAt: string;
  /** Heure de livraison promise. */
  promisedAt: string;
}

export interface DeliveryFilter {
  type: DeliveryType | "all";
  onlyLate: boolean;
}

export const isActive = (d: Delivery) => d.status === "searching" || d.status === "pickup" || d.status === "inTransit";

/** Minutes de retard par rapport à l'heure promise (0 si à l'heure ou terminée). */
export function lateMinutes(d: Delivery, now: Date): number {
  if (!isActive(d)) return 0;
  return Math.max(0, Math.round((now.getTime() - new Date(d.promisedAt).getTime()) / 60000));
}

export function cancelBlocker(d: Delivery, reason: string): string | null {
  if (!isActive(d)) return "Cette livraison est déjà terminée.";
  if (d.status === "inTransit") return "Colis en route : ouvrez un incident plutôt que d’annuler.";
  if (reason.trim().length < 5) return "Indiquez le motif (5 caractères minimum).";
  return null;
}
