import type { ManualAssignmentList } from "./scheduled-ride";

export interface ScheduledRidesRepository {
  list(): Promise<ManualAssignmentList>;
  assign(rideId: string, driverId: string): Promise<void>;
}
