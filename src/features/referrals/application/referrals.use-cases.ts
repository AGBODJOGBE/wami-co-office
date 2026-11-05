import { fail, guard } from "@/shared/lib/result";
import { activateBlocker, deleteBlocker, programBlocker, validateBlocker, type Referral, type ReferralConfig, type ReferralProgram } from "../domain/referral";
import type { ReferralsRepository } from "../domain/referrals.repository";
import { HttpReferralsRepository } from "./referrals.http-repository";

export function createReferralsUseCases(repo: ReferralsRepository) {
  return {
    list: () => guard(() => repo.list()),
    stats: () => guard(() => repo.stats()),
    configs: () => guard(() => repo.configs()),
    validate: async (r: Referral) => {
      const blocker = validateBlocker(r);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.validate(r.id));
    },
    expire: async (r: Referral) => {
      const blocker = validateBlocker(r);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.expire(r.id));
    },
    program: () => guard(() => repo.program()),
    saveProgram: async (p: ReferralProgram) => {
      const blocker = programBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveProgram(p));
    },
    flag: async (r: Referral) => {
      const blocker = validateBlocker(r);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.flag(r.id, "Bloqué depuis le back-office"));
    },
    activate: async (c: ReferralConfig) => {
      const blocker = activateBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.activate(c.id));
    },
    deactivate: async (c: ReferralConfig) => (c.active ? guard(() => repo.deactivate(c.id)) : fail("validation", "Cette configuration n’est pas active.")),
    remove: async (c: ReferralConfig) => {
      const blocker = deleteBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.remove(c.id));
    },
  };
}

export const referralsUseCases = createReferralsUseCases(new HttpReferralsRepository());
