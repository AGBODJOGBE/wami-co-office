/** Flotte : véhicules WAMI-CO (financés) et véhicules des partenaires. */

export type VehicleKind = "moto" | "car" | "tricycle";
export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = { moto: "Moto", car: "Auto", tricycle: "Tricycle" };

export interface Vehicle {
  id: string;
  plate: string;
  kind: VehicleKind;
  model: string;
  owner: "wamiCo" | "partner";
  driverId: string | null;
  driverName: string | null;
  insuranceExpiresAt: string;
  inspectionExpiresAt: string;
  status: "inService" | "available" | "maintenance";
}

/** Conducteur sans véhicule, proposé pour une affectation. */
export interface AssignableDriver {
  id: string;
  name: string;
}

export type ExpiryState = "ok" | "soon" | "expired";

export function expiryState(iso: string, now: Date, soonDays = 30): ExpiryState {
  const days = (new Date(iso).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "expired";
  return days <= soonDays ? "soon" : "ok";
}

export function assignBlocker(v: Vehicle, driverId: string | null, now: Date): string | null {
  if (v.status === "maintenance") return "Véhicule en maintenance.";
  if (driverId === null) return v.driverId ? null : "Ce véhicule n’est affecté à personne.";
  if (v.driverId === driverId) return "Déjà affecté à ce conducteur.";
  if (expiryState(v.insuranceExpiresAt, now) === "expired") return "Assurance expirée : affectation impossible.";
  if (v.owner === "partner") return "Un véhicule de partenaire reste à son propriétaire.";
  return null;
}
