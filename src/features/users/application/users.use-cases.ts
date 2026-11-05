import { fail, guard } from "@/shared/lib/result";
import { searchBlocker, type UserFilter } from "../domain/user";
import type { UsersRepository } from "../domain/users.repository";
import { HttpUsersRepository } from "./users.http-repository";

export function createUsersUseCases(repo: UsersRepository) {
  return {
    list: async (f: UserFilter) => {
      const blocker = searchBlocker(f.q);
      if (blocker) return fail<never>("validation", blocker);
      return guard(() => repo.list(f));
    },
  };
}

export const usersUseCases = createUsersUseCases(new HttpUsersRepository());
