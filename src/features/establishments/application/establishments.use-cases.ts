import { fail, guard, type Result } from "@/shared/lib/result";
import { commissionBlocker, suspendBlocker, type Activity, type Establishment } from "../domain/establishment";
import type { EstablishmentsRepository } from "../domain/establishments.repository";
import { HttpEstablishmentsRepository } from "./establishments.http-repository";

export function createEstablishmentsUseCases(repo: EstablishmentsRepository) {
  return {
    list: (activity: Activity | "all") => guard(() => repo.list(activity)),
    setCommission: (e: Establishment, rate: number | null): Promise<Result<Establishment>> => {
      const blocker = commissionBlocker(rate);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.setCommission(e.id, rate));
    },
    suspend: (e: Establishment, reason: string): Promise<Result<Establishment>> => {
      const blocker = suspendBlocker(e, reason);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.setStatus(e.id, "suspended", reason.trim()));
    },
    reinstate: (e: Establishment): Promise<Result<Establishment>> => {
      if (e.status !== "suspended") return Promise.resolve(fail("validation", "L’établissement n’est pas suspendu."));
      return guard(() => repo.setStatus(e.id, "open", "Réactivation"));
    },
  };
}

export const establishmentsUseCases = createEstablishmentsUseCases(new HttpEstablishmentsRepository());
