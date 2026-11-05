import { fail, guard } from "@/shared/lib/result";
import { cancelCommissionBlocker, configBlocker, holdBlocker, newAffiliateBlocker, releaseBlocker, type AffiliateConfig, type CommissionLine, type EligibilityResult, type NewAffiliate } from "../domain/affiliate-ops";
import type { AffiliateOpsRepository } from "../domain/affiliate-ops.repository";
import { HttpAffiliateOpsRepository } from "./affiliate-ops.http-repository";

export function createAffiliateOpsUseCases(repo: AffiliateOpsRepository) {
  return {
    config: () => guard(() => repo.config()),
    statement: (id: string) => guard(() => repo.statement(id)),
    skips: () => guard(() => repo.skips()),
    eligibility: async (phone: string) => (/^\+?[0-9 ]{8,15}$/.test(phone.trim()) ? guard(() => repo.eligibility(phone)) : fail<EligibilityResult>("validation", "Numéro de téléphone invalide.")),
    saveConfig: async (c: AffiliateConfig) => {
      const blocker = configBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveConfig(c));
    },
    create: async (a: NewAffiliate, eligibility: EligibilityResult | null) => {
      const blocker = newAffiliateBlocker(a, eligibility);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.create(a));
    },
    hold: async (l: CommissionLine, reason: string) => {
      const blocker = holdBlocker(l, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.hold(l.id, reason.trim()));
    },
    release: async (l: CommissionLine) => {
      const blocker = releaseBlocker(l);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.release(l.id));
    },
    cancel: async (l: CommissionLine, reason: string) => {
      const blocker = cancelCommissionBlocker(l, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.cancel(l.id, reason.trim()));
    },
  };
}

export const affiliateOpsUseCases = createAffiliateOpsUseCases(new HttpAffiliateOpsRepository());
