import { fail, guard, type Result } from "@/shared/lib/result";
import { statusChangeBlocker, type Driver, type DriverStatus } from "../domain/driver";
import type { DriversRepository } from "../domain/drivers.repository";
import { HttpDriversRepository } from "./drivers.http-repository";

export function createDriversUseCases(repo: DriversRepository) {
  return {
    list: (q: string) => guard(() => repo.list(q)),
    setStatus: (d: Driver, next: DriverStatus, reason: string): Promise<Result<Driver>> => {
      const blocker = statusChangeBlocker(d, next, reason);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.setStatus(d.id, next, reason.trim()));
    },
  };
}

export const driversUseCases = createDriversUseCases(new HttpDriversRepository());
