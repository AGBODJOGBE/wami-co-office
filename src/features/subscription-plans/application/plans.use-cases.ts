import { fail, guard } from "@/shared/lib/result";
import { deactivateBlocker, planBlocker, reactivateBlocker, type Plan, type PlanDraft } from "../domain/plan";
import type { PlansRepository } from "../domain/plans.repository";
import { HttpPlansRepository } from "./plans.http-repository";

export function createPlansUseCases(repo: PlansRepository) {
  return {
    list: () => guard(() => repo.list()),
    create: async (d: PlanDraft, existing: Plan[]) => {
      const blocker = planBlocker(d, existing);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.create(d));
    },
    update: async (p: Plan, d: PlanDraft, existing: Plan[]) => {
      const blocker = planBlocker(d, existing, p.id);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.update(p.id, d));
    },
    deactivate: async (p: Plan) => {
      const blocker = deactivateBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.deactivate(p.id));
    },
    reactivate: async (p: Plan) => {
      const blocker = reactivateBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reactivate(p.id));
    },
  };
}

export const plansUseCases = createPlansUseCases(new HttpPlansRepository());
