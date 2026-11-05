import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Ride, RideCategory, RideFilter } from "../domain/ride";
import type { RidesRepository } from "../domain/rides.repository";

/** Élément de `GET /api/admin/rides` (backend wami-co) : champs utilisés. */
export interface BackendRide {
  rideId: string;
  rideNumber: string;
  status: string;
  vehicleType: string;
  paymentMethod: string;
  passenger: { firstName: string; lastName: string };
  driver: { firstName: string; lastName: string } | null;
  pickup: { address: string | null };
  dropoff: { address: string | null };
  pricing: { estimatedPrice: number; finalPrice: number | null; waitingFee: number; platformCommission: number | null };
  distance: { estimatedMeters: number; actualMeters: number | null };
  duration: { estimatedSeconds: number; actualSeconds: number | null };
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
}

const CATEGORY: Record<string, RideCategory> = { MOTO: "moto", TRICYCLE: "tricycle", ECO: "autoEco" };
const CANCELLED = new Set(["CANCELLED_PASSENGER", "CANCELLED_DRIVER", "CANCELLED_SYSTEM", "NO_SHOW_PASSENGER", "NO_DRIVER_FOUND"]);
const FINISHED = new Set(["COMPLETED", "RATED"]);

export function toRide(r: BackendRide): Ride {
  const name = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
  const cancelledBy = r.cancelledBy === "PASSENGER" ? "customer" : r.cancelledBy === "DRIVER" ? "driver" : r.cancelledBy ? "admin" : null;
  return {
    id: r.rideId,
    number: r.rideNumber,
    category: CATEGORY[r.vehicleType] ?? "autoConfort",
    status: CANCELLED.has(r.status) ? "cancelled" : FINISHED.has(r.status) ? "completed" : "inProgress",
    customerName: name(r.passenger),
    driverName: r.driver ? name(r.driver) : null,
    from: r.pickup.address ?? "—",
    to: r.dropoff.address ?? "—",
    distanceKm: Math.round(((r.distance.actualMeters ?? r.distance.estimatedMeters) / 1000) * 10) / 10,
    durationMin: Math.round((r.duration.actualSeconds ?? r.duration.estimatedSeconds) / 60),
    price: r.pricing.finalPrice ?? r.pricing.estimatedPrice,
    waitingFee: r.pricing.waitingFee ?? 0,
    commission: r.pricing.platformCommission ?? 0,
    payment: r.paymentMethod === "CASH" ? "cash" : r.paymentMethod === "WALLET" ? "wallet" : "momo",
    requestedAt: r.createdAt,
    cancelReason: r.cancellationReason,
    cancelledBy,
  };
}

export class HttpRidesRepository implements RidesRepository {
  async list(filter: RideFilter) {
    const { rides } = await http.get<{ rides: BackendRide[] }>(API.rides.list, { limit: 200 });
    const needle = filter.q.trim().toLowerCase();
    return rides
      .map(toRide)
      .filter((r) => filter.status === "all" || r.status === filter.status)
      .filter((r) => !needle || `${r.number} ${r.customerName} ${r.driverName ?? ""}`.toLowerCase().includes(needle));
  }
  async cancel(id: string, reason: string) {
    // Annulation back-office : le backend n'accepte que CANCELLED_SYSTEM depuis une course en cours.
    await http.patch(API.rides.status(id), { status: "CANCELLED_SYSTEM", reason });
    const ride = (await this.list({ status: "all", q: "" })).find((r) => r.id === id);
    if (!ride) throw new Error("Course introuvable.");
    return ride;
  }
}
