import { fail, guard, type Result } from "@/shared/lib/result";
import { assignBlocker, type Courier, type Round } from "../domain/round";
import type { RoundsRepository } from "../domain/rounds.repository";
import { HttpRoundsRepository } from "./rounds.http-repository";

export function createRoundsUseCases(repo: RoundsRepository) {
  return {
    list: () => guard(() => repo.list()),
    couriers: () => guard(() => repo.couriers()),
    assign: (round: Round, courier: Courier): Promise<Result<Round>> => {
      const blocker = assignBlocker(round, courier);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.assign(round.id, courier.id));
    },
  };
}

export const roundsUseCases = createRoundsUseCases(new HttpRoundsRepository());
