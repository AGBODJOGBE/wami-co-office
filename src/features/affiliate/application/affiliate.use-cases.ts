import { fail, guard, type Result } from "@/shared/lib/result";
import { payoutBlocker, type Affiliate } from "../domain/affiliate";
import type { AffiliateRepository } from "../domain/affiliate.repository";
import { HttpAffiliateRepository } from "./affiliate.http-repository";

export function createAffiliateUseCases(repo: AffiliateRepository) {
  return {
    list: () => guard(() => repo.list()),
    pay: (a: Affiliate, amount: number): Promise<Result<Affiliate>> => {
      const blocker = payoutBlocker(a, amount);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.pay(a.id, amount));
    },
  };
}

export const affiliateUseCases = createAffiliateUseCases(new HttpAffiliateRepository());
