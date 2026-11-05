import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Challenge, ChallengeDraft } from "../domain/challenge";
import type { DriverBonusRepository } from "../domain/driver-bonus.repository";

export class HttpDriverBonusRepository implements DriverBonusRepository {
  list() {
    return http.get<Challenge[]>(API.driverBonus.challenges);
  }
  create(draft: ChallengeDraft) {
    return http.post<Challenge>(API.driverBonus.challenges, draft);
  }
  archive(id: string) {
    return http.patch<Challenge>(API.driverBonus.challenge(id), { archived: true });
  }
}
