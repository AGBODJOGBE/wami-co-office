import { fail, guard, type Result } from "@/shared/lib/result";
import { cancelBlocker, type Ride, type RideFilter } from "../domain/ride";
import type { RidesRepository } from "../domain/rides.repository";
import { HttpRidesRepository } from "./rides.http-repository";

export function createRidesUseCases(repo: RidesRepository) {
  return {
    list: (filter: RideFilter) => guard(() => repo.list(filter)),
    cancel: (ride: Ride, reason: string): Promise<Result<Ride>> => {
      const blocker = cancelBlocker(ride, reason);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.cancel(ride.id, reason.trim()));
    },
  };
}

export const ridesUseCases = createRidesUseCases(new HttpRidesRepository());
