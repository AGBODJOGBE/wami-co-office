import { fail, guard } from "@/shared/lib/result";
import { approveBlocker, rejectBlocker, type Withdrawal, type WithdrawalStatus } from "../domain/withdrawal";
import type { WithdrawalsRepository } from "../domain/withdrawals.repository";
import { HttpWithdrawalsRepository } from "./withdrawals.http-repository";

export function createWithdrawalsUseCases(repo: WithdrawalsRepository) {
  return {
    list: (status: WithdrawalStatus | "all") => guard(() => repo.list(status)),
    approve: async (w: Withdrawal) => {
      const blocker = approveBlocker(w);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.approve(w.id));
    },
    reject: async (w: Withdrawal, reason: string) => {
      const blocker = rejectBlocker(w, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reject(w.id, reason.trim()));
    },
  };
}

export const withdrawalsUseCases = createWithdrawalsUseCases(new HttpWithdrawalsRepository());
