import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Courier, Round } from "../domain/round";
import type { RoundsRepository } from "../domain/rounds.repository";

export class HttpRoundsRepository implements RoundsRepository {
  list() {
    return http.get<Round[]>(API.rounds.list);
  }
  couriers() {
    return http.get<Courier[]>(API.rounds.couriers);
  }
  assign(roundId: string, courierId: string) {
    return http.post<Round>(API.rounds.assign(roundId), { courierId });
  }
}
