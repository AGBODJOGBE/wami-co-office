import { fail, guard, type Result } from "@/shared/lib/result";
import { cancelBlocker, reassignBlocker, sortByPriority, type Incident, type Mission } from "../domain/live-ops";
import type { LiveOpsRepository } from "../domain/live-ops.repository";
import { HttpLiveOpsRepository } from "./live-ops.http-repository";

export function createLiveOpsUseCases(repo: LiveOpsRepository) {
  return {
    overview: () => guard(() => repo.overview()),

    /** Missions triées par urgence de traitement. */
    missions: async (): Promise<Result<Mission[]>> => {
      const r = await guard(() => repo.missions());
      return r.ok ? { ok: true, value: sortByPriority(r.value) } : r;
    },

    acknowledgeSos: (m: Mission): Promise<Result<Mission>> => {
      if (m.status !== "sos") return Promise.resolve(fail("validation", "Cette mission n’a pas d’alerte SOS."));
      return guard(() => repo.acknowledgeSos(m.id));
    },

    reassign: (m: Mission): Promise<Result<Mission>> => {
      const blocker = reassignBlocker(m);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.reassign(m.id));
    },

    cancel: (m: Mission, reason: string): Promise<Result<Mission>> => {
      const blocker = cancelBlocker(m, reason);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.cancel(m.id, reason.trim()));
    },

    incidents: () => guard(() => repo.incidents()),

    resolveIncident: (i: Incident, resolution: string): Promise<Result<Incident>> => {
      if (i.status === "resolved") return Promise.resolve(fail("unavailable", "Incident déjà résolu."));
      if (resolution.trim().length < 5) return Promise.resolve(fail("validation", "Décrivez la résolution."));
      return guard(() => repo.resolveIncident(i.id, resolution.trim()));
    },
  };
}

export const liveOpsUseCases = createLiveOpsUseCases(new HttpLiveOpsRepository());
