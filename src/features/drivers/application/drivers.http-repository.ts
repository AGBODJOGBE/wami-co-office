import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Driver, DriverStatus } from "../domain/driver";
import type { DriversRepository } from "../domain/drivers.repository";

export class HttpDriversRepository implements DriversRepository {
  list(q: string) {
    return http.get<Driver[]>(API.drivers.list, { q });
  }
  setStatus(id: string, status: DriverStatus, reason: string) {
    return http.post<Driver>(API.drivers.status(id), { status, reason });
  }
}
