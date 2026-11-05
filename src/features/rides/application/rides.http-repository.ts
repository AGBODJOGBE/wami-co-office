import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Ride, RideFilter } from "../domain/ride";
import type { RidesRepository } from "../domain/rides.repository";

export class HttpRidesRepository implements RidesRepository {
  list(filter: RideFilter) {
    return http.get<Ride[]>(API.rides.list, { status: filter.status === "all" ? undefined : filter.status, q: filter.q });
  }
  cancel(id: string, reason: string) {
    return http.post<Ride>(API.rides.cancel(id), { reason });
  }
}
