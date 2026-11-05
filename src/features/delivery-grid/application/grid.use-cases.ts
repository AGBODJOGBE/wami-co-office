import { fail, guard } from "@/shared/lib/result";
import { gridBlocker, type GridDraft } from "../domain/grid";
import type { GridRepository } from "../domain/grid.repository";
import { HttpGridRepository } from "./grid.http-repository";

export function createGridUseCases(repo: GridRepository) {
  return {
    active: () => guard(() => repo.active()),
    publish: async (d: GridDraft, existingVersions: string[]) => {
      const blocker = gridBlocker(d, existingVersions);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.publish(d));
    },
  };
}

export const gridUseCases = createGridUseCases(new HttpGridRepository());
