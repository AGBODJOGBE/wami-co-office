import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { ManualAssignmentList, ScheduledRide } from "../domain/scheduled-ride";
import type { ScheduledRidesRepository } from "../domain/scheduled-rides.repository";

/** Réponse de `GET /api/admin/scheduled-rides/manual-assignment` (backend wami-co). */
export interface BackendManualAssignment {
  thresholdMinutes: number;
  rides: Array<{
    rideId: string;
    rideNumber: string;
    scheduledAt: string;
    minutesUntilDeparture: number;
    vehicleType: string;
    pickup: { address: string | null };
    dropoff: { address: string | null };
    estimatedPrice: number;
    guaranteeAmount: number | null;
    candidates: Array<{
      driverId: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      rating: number;
      totalRides: number;
      vehicle: { make: string; model: string; licensePlate: string };
      isOnline: boolean;
      distanceMeters: number | null;
    }>;
  }>;
}

export function toList(r: BackendManualAssignment): ManualAssignmentList {
  return {
    thresholdMinutes: r.thresholdMinutes,
    rides: r.rides.map(
      (x): ScheduledRide => ({
        id: x.rideId,
        number: x.rideNumber,
        scheduledAt: x.scheduledAt,
        minutesLeft: x.minutesUntilDeparture,
        vehicleType: x.vehicleType,
        from: x.pickup.address ?? "—",
        to: x.dropoff.address ?? "—",
        price: x.estimatedPrice,
        guarantee: x.guaranteeAmount,
        candidates: x.candidates.map((c) => ({
          driverId: c.driverId,
          name: `${c.firstName} ${c.lastName}`.trim(),
          phone: c.phoneNumber,
          rating: c.rating,
          totalRides: c.totalRides,
          vehicle: `${c.vehicle.make} ${c.vehicle.model} · ${c.vehicle.licensePlate}`,
          online: c.isOnline,
          distanceM: c.distanceMeters,
        })),
      }),
    ),
  };
}

export class HttpScheduledRidesRepository implements ScheduledRidesRepository {
  async list() {
    return toList(await http.get<BackendManualAssignment>(API.scheduledRides.list));
  }
  async assign(rideId: string, driverId: string) {
    await http.post(API.scheduledRides.assign(rideId), { driverId });
  }
}
