import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { PromoCode } from "../domain/promo-code";
import type { PromoCodesRepository } from "../domain/promo-codes.repository";

export class HttpPromoCodesRepository implements PromoCodesRepository {
  list() {
    return http.get<PromoCode[]>(API.promoCodes.list);
  }
  create(p: PromoCode) {
    return http.post<PromoCode>(API.promoCodes.list, p);
  }
  setActive(code: string, active: boolean) {
    return http.patch<PromoCode>(API.promoCodes.item(code), { active });
  }
}
