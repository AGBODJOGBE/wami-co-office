/** Livraisons B2C : colis envoyés par un particulier, pris en charge par un livreur WAMI. */

export type B2cStatus = "searching" | "assigned" | "pickup" | "pickupFailed" | "transit" | "delivering" | "deliveryFailed" | "returning" | "returned" | "completed" | "cancelled";

export const B2C_STATUS_LABELS: Record<B2cStatus, string> = {
  searching: "Recherche d'un livreur",
  assigned: "Livreur en route",
  pickup: "Collecte en cours",
  pickupFailed: "Collecte échouée",
  transit: "En transit",
  delivering: "Remise en cours",
  deliveryFailed: "Remise échouée",
  returning: "Retour à l'expéditeur",
  returned: "Colis retourné",
  completed: "Livrée",
  cancelled: "Annulée",
};

/** Statuts après lesquels la livraison est terminée : plus d'annulation possible. */
export const FINAL_STATUSES: B2cStatus[] = ["returned", "completed", "cancelled"];

export interface B2cDelivery {
  id: string;
  number: string;
  status: B2cStatus;
  vehicleType: string;
  payment: string;
  sender: string;
  senderPhone: string | null;
  driver: string | null;
  driverPhone: string | null;
  from: string;
  to: string;
  recipient: string;
  recipientPhone: string;
  parcel: string;
  estimatedPrice: number;
  finalPrice: number | null;
  commission: number | null;
  driverPayout: number | null;
  pickupPhoto: string | null;
  deliveryPhoto: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

export interface B2cFilter {
  status: B2cStatus | "all" | "active" | "problem";
  q: string;
}

const PROBLEM: B2cStatus[] = ["pickupFailed", "deliveryFailed", "returning"];

export function matchesFilter(d: B2cDelivery, f: B2cFilter): boolean {
  const byStatus = f.status === "all" ? true : f.status === "active" ? !FINAL_STATUSES.includes(d.status) : f.status === "problem" ? PROBLEM.includes(d.status) : d.status === f.status;
  const needle = f.q.trim().toLowerCase();
  return byStatus && (!needle || `${d.number} ${d.sender} ${d.driver ?? ""} ${d.recipient}`.toLowerCase().includes(needle));
}

export function cancelBlocker(d: B2cDelivery, reason: string): string | null {
  if (FINAL_STATUSES.includes(d.status)) return "Cette livraison est terminée : elle ne peut plus être annulée.";
  if (d.status === "transit" || d.status === "delivering" || d.status === "returning") return "Le colis est avec le livreur : contactez-le avant d'annuler.";
  return reason.trim().length < 5 ? "Motif obligatoire (5 caractères minimum)." : null;
}

export interface B2cTotals {
  count: number;
  revenue: number;
  commission: number;
  problems: number;
}

export function totals(rows: B2cDelivery[]): B2cTotals {
  const done = rows.filter((r) => r.status === "completed");
  return { count: rows.length, revenue: done.reduce((s, r) => s + (r.finalPrice ?? 0), 0), commission: done.reduce((s, r) => s + (r.commission ?? 0), 0), problems: rows.filter((r) => PROBLEM.includes(r.status)).length };
}
