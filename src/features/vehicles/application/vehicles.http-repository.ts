import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AssignableDriver, Vehicle } from "../domain/vehicle";
import type { VehiclesRepository } from "../domain/vehicles.repository";

export class HttpVehiclesRepository implements VehiclesRepository {
  list() {
    return http.get<Vehicle[]>(API.vehicles.list);
  }
  /** Le backend n'a pas de filtre « sans véhicule » : on garde les chauffeurs non suspendus sans véhicule. */
  async assignableDrivers(): Promise<AssignableDriver[]> {
    const { drivers } = await http.get<{ drivers: Array<{ driverId: string; firstName: string; lastName: string; status: string; vehicle: unknown | null }> }>(API.drivers.list);
    return drivers
      .filter((d) => d.status !== "SUSPENDED" && d.vehicle === null)
      .map((d) => ({ id: d.driverId, name: `${d.firstName} ${d.lastName}`.trim() }));
  }
  assign(vehicleId: string, driverId: string | null) {
    return http.post<Vehicle>(API.vehicles.assign(vehicleId), { driverId });
  }
}
