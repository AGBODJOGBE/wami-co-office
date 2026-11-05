/** Tournées : plusieurs livraisons B2B regroupées pour un même livreur. */

export type VehicleClass = "moto" | "tricycle" | "van";

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = { moto: "Moto", tricycle: "Tricycle", van: "Fourgonnette" };

/** Capacité croissante : un tricycle peut faire une tournée « moto », pas l'inverse. */
const CAPACITY_RANK: Record<VehicleClass, number> = { moto: 1, tricycle: 2, van: 3 };

export interface RoundStop {
  id: string;
  address: string;
  recipient: string;
  status: "pending" | "done" | "failed";
}

export interface Round {
  id: string;
  name: string;
  accountName: string;
  date: string;
  status: "planned" | "inProgress" | "done";
  requiredVehicle: VehicleClass;
  parcels: number;
  courierId: string | null;
  courierName: string | null;
  stops: RoundStop[];
}

export interface Courier {
  id: string;
  name: string;
  vehicle: VehicleClass;
  online: boolean;
  /** Tournée déjà affectée aujourd'hui. */
  busy: boolean;
}

export function progress(r: Round): { done: number; total: number } {
  return { done: r.stops.filter((s) => s.status !== "pending").length, total: r.stops.length };
}

export function assignBlocker(r: Round, c: Courier): string | null {
  if (r.status !== "planned") return "Seule une tournée planifiée peut être (ré)affectée.";
  if (!c.online) return `${c.name} n’est pas en ligne.`;
  if (c.busy) return `${c.name} a déjà une tournée.`;
  if (CAPACITY_RANK[c.vehicle] < CAPACITY_RANK[r.requiredVehicle]) {
    return `Véhicule trop petit : il faut au minimum ${VEHICLE_CLASS_LABELS[r.requiredVehicle].toLowerCase()}.`;
  }
  return null;
}
