import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Challenge, ChallengeDraft } from "../domain/challenge";
import type { ChallengesRepository } from "../domain/challenges.repository";

/** Défis « X missions = Y F » : route absente du backend actuel (faux backend). Voir `shared/config/missing-routes.ts`. */
export class HttpChallengesRepository implements ChallengesRepository {
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
