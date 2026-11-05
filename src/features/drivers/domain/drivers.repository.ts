import type { Driver, DriverStatus } from "./driver";

export interface DriversRepository {
  list(q: string): Promise<Driver[]>;
  setStatus(id: string, status: DriverStatus, reason: string): Promise<Driver>;
}
