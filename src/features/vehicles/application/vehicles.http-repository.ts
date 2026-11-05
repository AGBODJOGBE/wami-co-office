import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AssignableDriver, Vehicle } from "../domain/vehicle";
import type { VehiclesRepository } from "../domain/vehicles.repository";

export class HttpVehiclesRepository implements VehiclesRepository {
  list() {
    return http.get<Vehicle[]>(API.vehicles.list);
  }
  assignableDrivers() {
    return http.get<AssignableDriver[]>(API.drivers.list, { withoutVehicle: true, fields: "id,name" });
  }
  assign(vehicleId: string, driverId: string | null) {
    return http.post<Vehicle>(API.vehicles.assign(vehicleId), { driverId });
  }
}
