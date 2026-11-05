import { fail, guard } from "@/shared/lib/result";
import { closeBlocker, reactivateBlocker, rateBlocker, reopenBlocker, suspendBlocker, type Affiliate, type SuspensionMode } from "../domain/affiliate";
import type { AffiliateRepository } from "../domain/affiliate.repository";
import { HttpAffiliateRepository } from "./affiliate.http-repository";

export function createAffiliateUseCases(repo: AffiliateRepository) {
  return {
    list: () => guard(() => repo.list()),
    suspend: async (a: Affiliate, mode: SuspensionMode, reason: string) => {
      const blocker = suspendBlocker(a, mode, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.suspend(a.id, mode, reason.trim()));
    },
    reactivate: async (a: Affiliate) => {
      const blocker = reactivateBlocker(a);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reactivate(a.id));
    },
    close: async (a: Affiliate, reason: string) => {
      const blocker = closeBlocker(a, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.close(a.id, reason.trim()));
    },
    reopen: async (a: Affiliate, reason: string) => {
      const blocker = reopenBlocker(a, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reopen(a.id, reason.trim()));
    },
    setCommissionRate: async (a: Affiliate, rate: number | null) => {
      const blocker = rateBlocker(rate);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.setCommissionRate(a.id, rate));
    },
  };
}

export const affiliateUseCases = createAffiliateUseCases(new HttpAffiliateRepository());
