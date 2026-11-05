import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Activity, Establishment, EstablishmentStatus } from "../domain/establishment";
import type { EstablishmentsRepository } from "../domain/establishments.repository";

export class HttpEstablishmentsRepository implements EstablishmentsRepository {
  list(activity: Activity | "all") {
    return http.get<Establishment[]>(API.establishments.list, { activity: activity === "all" ? undefined : activity });
  }
  setCommission(id: string, rate: number | null) {
    return http.put<Establishment>(API.establishments.commission(id), { rate });
  }
  setStatus(id: string, status: EstablishmentStatus, reason: string) {
    return http.post<Establishment>(API.establishments.status(id), { status, reason });
  }
}
