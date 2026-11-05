import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Incident, Mission, Overview } from "../domain/live-ops";
import type { LiveOpsRepository } from "../domain/live-ops.repository";

export class HttpLiveOpsRepository implements LiveOpsRepository {
  overview() {
    return http.get<Overview>(API.dashboard.overview);
  }
  missions() {
    return http.get<Mission[]>(API.liveOps.missions);
  }
  acknowledgeSos(missionId: string) {
    return http.post<Mission>(API.liveOps.acknowledgeSos(missionId));
  }
  reassign(missionId: string) {
    return http.post<Mission>(API.liveOps.reassign(missionId));
  }
  cancel(missionId: string, reason: string) {
    return http.post<Mission>(API.liveOps.cancel(missionId), { reason });
  }
  incidents() {
    return http.get<Incident[]>(API.liveOps.incidents);
  }
  resolveIncident(incidentId: string, resolution: string) {
    return http.post<Incident>(API.liveOps.resolveIncident(incidentId), { resolution });
  }
}
