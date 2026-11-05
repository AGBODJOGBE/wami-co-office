import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { DriverSessions, DriverType, OnlineDriver, PendingDriver } from "../domain/driver-ops";
import type { DriverOpsRepository } from "../domain/driver-ops.repository";

export interface BackendOnline {
  driverId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  rating: number;
  totalRides: number;
  latitude: number;
  longitude: number;
  vehicle: { make: string; model: string; licensePlate: string } | null;
  isInRide: boolean;
  updatedAt: string;
}

export const toOnline = (d: BackendOnline): OnlineDriver => ({
  id: d.driverId,
  name: `${d.firstName} ${d.lastName}`.trim(),
  phone: d.phoneNumber,
  rating: d.rating,
  totalRides: d.totalRides,
  latitude: d.latitude,
  longitude: d.longitude,
  vehicle: d.vehicle ? `${d.vehicle.make} ${d.vehicle.model} · ${d.vehicle.licensePlate}` : "—",
  inRide: d.isInRide,
  updatedAt: d.updatedAt,
});

export class HttpDriverOpsRepository implements DriverOpsRepository {
  async pending() {
    const { drivers } = await http.get<{ drivers: Array<{ driverId: string; userId: string; isDocumentsVerified: boolean; createdAt: string }> }>(API.drivers.pending);
    return drivers.map((d): PendingDriver => ({ id: d.driverId, userId: d.userId, documentsVerified: d.isDocumentsVerified, createdAt: d.createdAt }));
  }
  async approve(id: string) {
    await http.patch(API.drivers.approve(id));
  }
  async online() {
    const { drivers } = await http.get<{ drivers: BackendOnline[] }>(API.drivers.online);
    return drivers.map(toOnline);
  }
  async setType(id: string, type: DriverType) {
    await http.patch(API.drivers.type(id), { driverType: type });
  }
  async sessions(id: string): Promise<DriverSessions> {
    const r = await http.get<{ sessions: Array<{ id: string; startedAt: string; endedAt: string | null; durationSeconds: number | null; endReason: string | null }>; totalDurationSeconds: number }>(API.drivers.sessions(id), { limit: 20 });
    return { sessions: r.sessions, totalSeconds: r.totalDurationSeconds };
  }
}
