import { fail, guard, type Result } from "@/shared/lib/result";
import { creditLimitBlocker, type B2bAccount } from "../domain/b2b";
import type { B2bRepository } from "../domain/b2b.repository";
import { HttpB2bRepository } from "./b2b.http-repository";

export function createB2bUseCases(repo: B2bRepository) {
  return {
    accounts: () => guard(() => repo.accounts()),
    invoices: (accountId: string) => guard(() => repo.invoices(accountId)),
    setCreditLimit: (a: B2bAccount, limit: number): Promise<Result<B2bAccount>> => {
      const blocker = creditLimitBlocker(a, limit);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.update(a.id, { creditLimit: limit }));
    },
    toggleSuspended: (a: B2bAccount) => guard(() => repo.update(a.id, { status: a.status === "active" ? "suspended" : "active" })),
  };
}

export const b2bUseCases = createB2bUseCases(new HttpB2bRepository());
