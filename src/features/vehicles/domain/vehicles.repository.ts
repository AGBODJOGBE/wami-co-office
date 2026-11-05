import type { AssignableDriver, Vehicle } from "./vehicle";

export interface VehiclesRepository {
  list(): Promise<Vehicle[]>;
  assignableDrivers(): Promise<AssignableDriver[]>;
  assign(vehicleId: string, driverId: string | null): Promise<Vehicle>;
}
