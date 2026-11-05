import { fail, guard } from "@/shared/lib/result";
import { validateBlocker, type PendingPartner } from "../domain/partner";
import type { PartnersRepository } from "../domain/partners.repository";
import { HttpPartnersRepository } from "./partners.http-repository";

export function createPartnersUseCases(repo: PartnersRepository) {
  return {
    pending: () => guard(() => repo.pending()),
    validate: async (p: PendingPartner, confirmed: boolean) => {
      const blocker = validateBlocker(p, confirmed);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.validate(p.id));
    },
  };
}

export const partnersUseCases = createPartnersUseCases(new HttpPartnersRepository());
