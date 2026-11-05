import { fail, guard } from "@/shared/lib/result";
import { approveBlocker, typeBlocker, type DriverType, type PendingDriver } from "../domain/driver-ops";
import type { DriverOpsRepository } from "../domain/driver-ops.repository";
import { HttpDriverOpsRepository } from "./driver-ops.http-repository";

export function createDriverOpsUseCases(repo: DriverOpsRepository) {
  return {
    pending: () => guard(() => repo.pending()),
    online: () => guard(() => repo.online()),
    sessions: (id: string) => guard(() => repo.sessions(id)),
    approve: async (p: PendingDriver) => {
      const blocker = approveBlocker(p);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.approve(p.id));
    },
    setType: async (id: string, current: DriverType, next: DriverType) => {
      const blocker = typeBlocker(current, next);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.setType(id, next));
    },
  };
}

export const driverOpsUseCases = createDriverOpsUseCases(new HttpDriverOpsRepository());
