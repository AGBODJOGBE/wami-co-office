import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Driver, DriverStatus } from "../domain/driver";
import type { DriversRepository } from "../domain/drivers.repository";

/** Élément de `GET /api/admin/drivers` (backend wami-co). */
export interface BackendDriver {
  driverId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: "AVAILABLE" | "BUSY" | "OFFLINE" | "SUSPENDED";
  driverType: "VTC" | "DELIVERY" | "BOTH";
  rating: number;
  totalRides: number;
  vehicle: { make: string; model: string; color: string; licensePlate: string } | null;
  createdAt: string;
}

const ACTIVITIES: Record<BackendDriver["driverType"], Driver["activities"]> = {
  VTC: ["driver"],
  DELIVERY: ["courier"],
  BOTH: ["driver", "courier"],
};

export function toDriver(d: BackendDriver): Driver {
  return {
    id: d.driverId,
    name: `${d.firstName} ${d.lastName}`.trim(),
    phone: d.phoneNumber,
    activities: ACTIVITIES[d.driverType] ?? ["driver"],
    vehicle: d.vehicle ? `${[d.vehicle.make, d.vehicle.model].filter(Boolean).join(" ")} · ${d.vehicle.licensePlate}` : "Aucun véhicule",
    status: d.status === "SUSPENDED" ? "suspended" : "active",
    online: d.status === "AVAILABLE" || d.status === "BUSY",
    rating: d.rating,
    acceptanceRate: null,
    missionsTotal: d.totalRides,
    joinedAt: d.createdAt,
    documentsExpiringSoon: null,
    suspensionReason: null,
  };
}

export class HttpDriversRepository implements DriversRepository {
  async list(q: string) {
    const { drivers } = await http.get<{ drivers: BackendDriver[] }>(API.drivers.list);
    const all = drivers.map(toDriver);
    const needle = q.trim().toLowerCase();
    // Le backend ignore `search` : le filtre se fait ici.
    return needle ? all.filter((d) => `${d.name} ${d.phone}`.toLowerCase().includes(needle)) : all;
  }
  async setStatus(id: string, status: DriverStatus, reason: string) {
    if (status === "suspended") await http.patch(API.drivers.suspend(id), { reason });
    else await http.patch(API.drivers.reactivate(id));
    const current = (await this.list("")).find((d) => d.id === id);
    if (!current) throw new Error("Chauffeur introuvable.");
    return status === "suspended" ? { ...current, status, suspensionReason: reason } : current;
  }
}
