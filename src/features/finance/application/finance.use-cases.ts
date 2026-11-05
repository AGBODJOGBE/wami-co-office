import { fail, guard, type Result } from "@/shared/lib/result";
import { approveBlocker, submitBlocker, type PayoutBatch } from "../domain/payout";
import type { FinanceRepository } from "../domain/finance.repository";
import { HttpFinanceRepository } from "./finance.http-repository";

export function createFinanceUseCases(repo: FinanceRepository) {
  return {
    summary: () => guard(() => repo.summary()),
    currentBatch: () => guard(() => repo.currentBatch()),
    submit: (b: PayoutBatch, ids: string[]): Promise<Result<PayoutBatch>> => {
      const blocker = submitBlocker(b, ids);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.submit(ids));
    },
    approve: (b: PayoutBatch, agentId: string): Promise<Result<PayoutBatch>> => {
      const blocker = approveBlocker(b, agentId);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.approve());
    },
  };
}

export const financeUseCases = createFinanceUseCases(new HttpFinanceRepository());
