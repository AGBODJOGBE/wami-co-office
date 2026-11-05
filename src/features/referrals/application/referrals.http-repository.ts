import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Referral, ReferralProgram } from "../domain/referral";
import type { ReferralsRepository } from "../domain/referrals.repository";

export class HttpReferralsRepository implements ReferralsRepository {
  program() {
    return http.get<ReferralProgram>(API.referrals.program);
  }
  saveProgram(p: ReferralProgram) {
    return http.put<ReferralProgram>(API.referrals.program, p);
  }
  list() {
    return http.get<Referral[]>(API.referrals.list);
  }
  flag(id: string, reason: string) {
    return http.post<Referral>(API.referrals.flag(id), { reason });
  }
}
