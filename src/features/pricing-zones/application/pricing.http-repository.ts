import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Commission, Tariff, Zone } from "../domain/pricing";
import type { PricingRepository } from "../domain/pricing.repository";

export class HttpPricingRepository implements PricingRepository {
  zones() {
    return http.get<Zone[]>(API.pricing.zones);
  }
  tariffs(zoneId: string) {
    return http.get<Tariff[]>(API.pricing.tariffs(zoneId));
  }
  saveTariff(zoneId: string, t: Tariff) {
    return http.put<Tariff>(API.pricing.tariff(zoneId, t.service), t);
  }
  commissions() {
    return http.get<Commission[]>(API.pricing.commissions);
  }
}
