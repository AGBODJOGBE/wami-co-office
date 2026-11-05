import type { Ride, RideFilter } from "./ride";

export interface RidesRepository {
  list(filter: RideFilter): Promise<Ride[]>;
  cancel(id: string, reason: string): Promise<Ride>;
}
