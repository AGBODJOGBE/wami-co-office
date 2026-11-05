import { fail, guard, type Result } from "@/shared/lib/result";
import { draftBlocker, state, type Challenge, type ChallengeDraft } from "../domain/challenge";
import type { DriverBonusRepository } from "../domain/driver-bonus.repository";
import { HttpDriverBonusRepository } from "./driver-bonus.http-repository";

export function createDriverBonusUseCases(repo: DriverBonusRepository, clock: () => Date = () => new Date()) {
  return {
    list: () => guard(() => repo.list()),
    create: (draft: ChallengeDraft): Promise<Result<Challenge>> => {
      const blocker = draftBlocker(draft, clock());
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.create({ ...draft, title: draft.title.trim() }));
    },
    archive: (c: Challenge): Promise<Result<Challenge>> => {
      if (state(c, clock()) === "running") return Promise.resolve(fail("validation", "Impossible d’archiver un challenge en cours : attendez sa fin."));
      return guard(() => repo.archive(c.id));
    },
  };
}

export const driverBonusUseCases = createDriverBonusUseCases(new HttpDriverBonusRepository());
