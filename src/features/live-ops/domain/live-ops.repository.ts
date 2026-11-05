import type { Incident, Mission, Overview } from "./live-ops";

export interface LiveOpsRepository {
  overview(): Promise<Overview>;
  missions(): Promise<Mission[]>;
  acknowledgeSos(missionId: string): Promise<Mission>;
  reassign(missionId: string): Promise<Mission>;
  cancel(missionId: string, reason: string): Promise<Mission>;
  incidents(): Promise<Incident[]>;
  resolveIncident(incidentId: string, resolution: string): Promise<Incident>;
}
