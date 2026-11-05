import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Delivery, DeliveryFilter } from "../domain/delivery";
import type { DeliveryRepository } from "../domain/delivery.repository";

export class HttpDeliveryRepository implements DeliveryRepository {
  list(filter: DeliveryFilter) {
    return http.get<Delivery[]>(API.delivery.list, { type: filter.type === "all" ? undefined : filter.type });
  }
  cancel(id: string, reason: string) {
    return http.post<Delivery>(API.delivery.cancel(id), { reason });
  }
}
