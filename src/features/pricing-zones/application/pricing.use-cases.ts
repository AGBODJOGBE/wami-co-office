import { fail, guard, type Result } from "@/shared/lib/result";
import { tariffBlocker, type Tariff } from "../domain/pricing";
import type { PricingRepository } from "../domain/pricing.repository";
import { HttpPricingRepository } from "./pricing.http-repository";

export function createPricingUseCases(repo: PricingRepository) {
  return {
    zones: () => guard(() => repo.zones()),
    tariffs: (zoneId: string) => guard(() => repo.tariffs(zoneId)),
    /** S'applique aux nouvelles demandes uniquement ; historisé côté backend. */
    saveTariff: (zoneId: string, t: Tariff): Promise<Result<Tariff>> => {
      const blocker = tariffBlocker(t);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.saveTariff(zoneId, t));
    },
    commissions: () => guard(() => repo.commissions()),
  };
}

export const pricingUseCases = createPricingUseCases(new HttpPricingRepository());
