import { fail, guard } from "@/shared/lib/result";
import { draftBlocker, activateBlocker, deactivateBlocker, deleteBlocker, type BonusConfig, type BonusDraft, type BonusFamily, type BonusLedger, type BonusRunConfig } from "../domain/bonus";
import type { DriverBonusRepository } from "../domain/driver-bonus.repository";
import { HttpDriverBonusRepository } from "./driver-bonus.http-repository";

export function createDriverBonusUseCases(repo: DriverBonusRepository) {
  return {
    configs: (family: BonusFamily) => guard(() => repo.configs(family)),
    entries: (ledger: BonusLedger) => guard(() => repo.entries(ledger)),
    runConfig: () => guard(() => repo.runConfig()),
    saveRunConfig: (cfg: BonusRunConfig) => guard(() => repo.saveRunConfig(cfg)),
    create: async (d: BonusDraft) => {
      const blocker = draftBlocker(d);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.create({ ...d, name: d.name.trim() }));
    },
    update: async (c: BonusConfig, d: BonusDraft) => {
      const blocker = draftBlocker({ ...d, family: c.family });
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.update(c, { ...d, name: d.name.trim() }));
    },
    activate: async (c: BonusConfig) => {
      const blocker = activateBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.activate(c));
    },
    deactivate: async (c: BonusConfig) => {
      const blocker = deactivateBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.deactivate(c));
    },
    remove: async (c: BonusConfig) => {
      const blocker = deleteBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.remove(c));
    },
  };
}

export const driverBonusUseCases = createDriverBonusUseCases(new HttpDriverBonusRepository());
