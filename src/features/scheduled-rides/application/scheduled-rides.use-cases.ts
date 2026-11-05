import { fail, guard } from "@/shared/lib/result";
import { assignBlocker, type Candidate, type ScheduledRide } from "../domain/scheduled-ride";
import type { ScheduledRidesRepository } from "../domain/scheduled-rides.repository";
import { HttpScheduledRidesRepository } from "./scheduled-rides.http-repository";

export function createScheduledRidesUseCases(repo: ScheduledRidesRepository) {
  return {
    list: () => guard(() => repo.list()),
    assign: async (r: ScheduledRide, c: Candidate) => {
      const blocker = assignBlocker(r, c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.assign(r.id, c.driverId));
    },
  };
}

export const scheduledRidesUseCases = createScheduledRidesUseCases(new HttpScheduledRidesRepository());
