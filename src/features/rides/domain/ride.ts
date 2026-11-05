/** Historique des courses (moto, auto, tricycle). */

export type RideCategory = "moto" | "autoEco" | "autoConfort" | "tricycle";

export const RIDE_CATEGORY_LABELS: Record<RideCategory, string> = {
  moto: "Moto",
  autoEco: "Auto éco",
  autoConfort: "Auto confort",
  tricycle: "Tricycle",
};

export type RideStatus = "inProgress" | "completed" | "cancelled";

export interface Ride {
  id: string;
  category: RideCategory;
  status: RideStatus;
  customerName: string;
  driverName: string | null;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  price: number;
  waitingFee: number;
  commission: number;
  payment: "cash" | "wallet" | "momo";
  requestedAt: string;
  cancelReason: string | null;
  cancelledBy: "customer" | "driver" | "admin" | null;
}

export interface RideFilter {
  status: RideStatus | "all";
  q: string;
}

export interface RideTotals {
  count: number;
  revenue: number;
  commission: number;
  cancellationRate: number;
}

export function totals(rides: Ride[]): RideTotals {
  const done = rides.filter((r) => r.status === "completed");
  const cancelled = rides.filter((r) => r.status === "cancelled").length;
  return {
    count: done.length,
    revenue: done.reduce((s, r) => s + r.price + r.waitingFee, 0),
    commission: done.reduce((s, r) => s + r.commission, 0),
    cancellationRate: rides.length ? cancelled / rides.length : 0,
  };
}

/** Seule une course en cours peut être annulée depuis le back-office. */
export function cancelBlocker(ride: Ride, reason: string): string | null {
  if (ride.status !== "inProgress") return "Seule une course en cours peut être annulée.";
  if (reason.trim().length < 5) return "Indiquez le motif (5 caractères minimum).";
  return null;
}
