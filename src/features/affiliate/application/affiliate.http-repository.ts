import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Affiliate } from "../domain/affiliate";
import type { AffiliateRepository } from "../domain/affiliate.repository";

export class HttpAffiliateRepository implements AffiliateRepository {
  list() {
    return http.get<Affiliate[]>(API.affiliate.list);
  }
  pay(id: string, amount: number) {
    return http.post<Affiliate>(API.affiliate.pay(id), { amount });
  }
}
