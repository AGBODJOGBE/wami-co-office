import { fail, guard } from "@/shared/lib/result";
import { activateBlocker, deactivateBlocker, deleteBlocker, zoneBlocker, type PricingZone, type ProfileSummary, type ZoneDraft } from "../domain/pricing-profile";
import type { PricingProfilesRepository } from "../domain/pricing-profiles.repository";
import { HttpPricingProfilesRepository } from "./pricing-profiles.http-repository";

export function createPricingProfilesUseCases(repo: PricingProfilesRepository) {
  return {
    profiles: () => guard(() => repo.profiles()),
    profile: (id: string) => guard(() => repo.profile(id)),
    zones: () => guard(() => repo.zones()),
    activate: async (p: ProfileSummary) => {
      const blocker = activateBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.activate(p.id));
    },
    deactivate: async (p: ProfileSummary) => {
      const blocker = deactivateBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.deactivate(p.id));
    },
    removeProfile: async (p: ProfileSummary) => {
      const blocker = deleteBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.removeProfile(p.id));
    },
    createZone: async (d: ZoneDraft, existing: PricingZone[]) => {
      const blocker = zoneBlocker(d, existing);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.createZone(d));
    },
    setZoneActive: (z: PricingZone, active: boolean) => guard(() => repo.setZoneActive(z.id, active)),
    removeZone: (z: PricingZone) => guard(() => repo.removeZone(z.id)),
  };
}

export const pricingProfilesUseCases = createPricingProfilesUseCases(new HttpPricingProfilesRepository());
