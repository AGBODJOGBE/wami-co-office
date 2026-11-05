import { fail, guard, type Result } from "@/shared/lib/result";
import { assignBlocker, type Vehicle } from "../domain/vehicle";
import type { VehiclesRepository } from "../domain/vehicles.repository";
import { HttpVehiclesRepository } from "./vehicles.http-repository";

export function createVehiclesUseCases(repo: VehiclesRepository, clock: () => Date = () => new Date()) {
  return {
    list: () => guard(() => repo.list()),
    assignableDrivers: () => guard(() => repo.assignableDrivers()),
    assign: (v: Vehicle, driverId: string | null): Promise<Result<Vehicle>> => {
      const blocker = assignBlocker(v, driverId, clock());
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.assign(v.id, driverId));
    },
  };
}

export const vehiclesUseCases = createVehiclesUseCases(new HttpVehiclesRepository());
