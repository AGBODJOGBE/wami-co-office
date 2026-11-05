import { fail, guard } from "@/shared/lib/result";
import { switchModeBlocker, unblockBlocker, updateRateBlocker } from "../domain/contract-ops";
import type { ContractOpsRepository } from "../domain/contract-ops.repository";
import type { LeaseContract } from "../domain/lease-contract";
import { HttpContractOpsRepository } from "./contract-ops.http-repository";

export function createContractOpsUseCases(repo: ContractOpsRepository) {
  return {
    kpis: () => guard(() => repo.kpis()),
    audit: () => guard(() => repo.audit()),
    alerts: () => guard(() => repo.alerts()),
    withholdings: (contractId: string) => guard(() => repo.withholdings(contractId)),
    switchToRevenueShare: async (c: LeaseContract, rate: number) => {
      const blocker = switchModeBlocker(c, rate);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.switchToRevenueShare(c.id, rate));
    },
    updateRate: async (c: LeaseContract, rate: number) => {
      const blocker = updateRateBlocker(c, rate);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.updateRate(c.id, rate));
    },
    unblockDriver: async (c: LeaseContract, threshold: number) => {
      const blocker = unblockBlocker(c, threshold);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.unblockDriver(c.driverId));
    },
  };
}

export const contractOpsUseCases = createContractOpsUseCases(new HttpContractOpsRepository());
