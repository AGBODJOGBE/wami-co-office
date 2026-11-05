import { fail, guard, type Result } from "@/shared/lib/result";
import { draftBlocker, state, type Challenge, type ChallengeDraft } from "../domain/challenge";
import type { ChallengesRepository } from "../domain/challenges.repository";
import { HttpChallengesRepository } from "./challenges.http-repository";

export function createChallengesUseCases(repo: ChallengesRepository, clock: () => Date = () => new Date()) {
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

export const challengesUseCases = createChallengesUseCases(new HttpChallengesRepository());
