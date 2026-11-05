import { guard } from "@/shared/lib/result";
import type { RideDetailRepository } from "../domain/ride-detail.repository";
import { HttpRideDetailRepository } from "./ride-detail.http-repository";

export function createRideDetailUseCases(repo: RideDetailRepository) {
  return {
    detail: (rideId: string) => guard(() => repo.detail(rideId)),
    settlement: (rideId: string) => guard(() => repo.settlement(rideId)),
  };
}

export const rideDetailUseCases = createRideDetailUseCases(new HttpRideDetailRepository());
