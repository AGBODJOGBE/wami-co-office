import { fail, guard, type Result } from "@/shared/lib/result";
import { paymentBlocker, type LeaseContract, type LeasePayment } from "../domain/lease-contract";
import type { ContractsRepository } from "../domain/contracts.repository";
import { HttpContractsRepository } from "./contracts.http-repository";

export function createContractsUseCases(repo: ContractsRepository) {
  return {
    list: () => guard(() => repo.list()),
    recordPayment: (c: LeaseContract, amount: number, method: LeasePayment["method"]): Promise<Result<LeaseContract>> => {
      const blocker = paymentBlocker(c, amount);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.recordPayment(c.id, amount, method));
    },
  };
}

export const contractsUseCases = createContractsUseCases(new HttpContractsRepository());
