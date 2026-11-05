import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { ServiceCategory } from "../domain/vtc";
import type { VtcRepository } from "../domain/vtc.repository";

export class HttpVtcRepository implements VtcRepository {
  categories() {
    return http.get<ServiceCategory[]>(API.vtc.categories);
  }
  setActive(key: string, active: boolean) {
    return http.patch<ServiceCategory>(API.vtc.category(key), { active });
  }
}
