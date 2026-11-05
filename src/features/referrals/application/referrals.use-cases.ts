import { fail, guard, type Result } from "@/shared/lib/result";
import { programBlocker, type Referral, type ReferralProgram } from "../domain/referral";
import type { ReferralsRepository } from "../domain/referrals.repository";
import { HttpReferralsRepository } from "./referrals.http-repository";

export function createReferralsUseCases(repo: ReferralsRepository) {
  return {
    program: () => guard(() => repo.program()),
    saveProgram: (p: ReferralProgram): Promise<Result<ReferralProgram>> => {
      const blocker = programBlocker(p);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.saveProgram(p));
    },
    list: () => guard(() => repo.list()),
    flag: (r: Referral): Promise<Result<Referral>> => {
      if (r.status !== "pending") return Promise.resolve(fail("validation", "Seul un parrainage en attente peut être bloqué."));
      return guard(() => repo.flag(r.id, r.suspicion ?? "Bloqué manuellement"));
    },
  };
}

export const referralsUseCases = createReferralsUseCases(new HttpReferralsRepository());
