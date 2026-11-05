import type { DriverSessions, DriverType, OnlineDriver, PendingDriver } from "./driver-ops";

export interface DriverOpsRepository {
  pending(): Promise<PendingDriver[]>;
  approve(id: string): Promise<void>;
  online(): Promise<OnlineDriver[]>;
  setType(id: string, type: DriverType): Promise<void>;
  sessions(id: string): Promise<DriverSessions>;
}
