import { fail, guard } from "@/shared/lib/result";
import { paymentBlocker, transitionBlocker, type LeaseContract, type PaymentMethod } from "../domain/lease-contract";
import type { ContractsRepository } from "../domain/contracts.repository";
import { HttpContractsRepository } from "./contracts.http-repository";

export function createContractsUseCases(repo: ContractsRepository) {
  return {
    list: () => guard(() => repo.list()),
    installments: (contractId: string) => guard(() => repo.installments(contractId)),
    recordPayment: async (c: LeaseContract, amount: number, method: PaymentMethod, reference: string) => {
      const blocker = paymentBlocker(c, amount, reference);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.recordPayment(c.id, amount, method, reference.trim()));
    },
    suspend: async (c: LeaseContract, reason: string) => {
      const blocker = transitionBlocker(c, "suspend", reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.suspend(c.id, reason.trim()));
    },
    resume: async (c: LeaseContract) => {
      const blocker = transitionBlocker(c, "resume", "");
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.resume(c.id));
    },
    breakContract: async (c: LeaseContract, reason: string) => {
      const blocker = transitionBlocker(c, "break", reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.breakContract(c.id, reason.trim()));
    },
  };
}

export const contractsUseCases = createContractsUseCases(new HttpContractsRepository());
