import { fail, guard, type Result } from "@/shared/lib/result";
import { deactivateBlocker, type ServiceCategory } from "../domain/vtc";
import type { VtcRepository } from "../domain/vtc.repository";
import { HttpVtcRepository } from "./vtc.http-repository";

export function createVtcUseCases(repo: VtcRepository) {
  return {
    categories: () => guard(() => repo.categories()),
    toggle: (cat: ServiceCategory, all: ServiceCategory[]): Promise<Result<ServiceCategory>> => {
      const blocker = deactivateBlocker(cat, all);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.setActive(cat.key, !cat.active));
    },
  };
}

export const vtcUseCases = createVtcUseCases(new HttpVtcRepository());
