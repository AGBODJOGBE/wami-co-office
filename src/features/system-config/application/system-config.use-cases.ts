import { fail, guard } from "@/shared/lib/result";
import { paramBlocker, versionBlocker, type AppVersionDraft, type ParamEdit, type SystemParam } from "../domain/system-config";
import type { SystemConfigRepository } from "../domain/system-config.repository";
import { HttpSystemConfigRepository } from "./system-config.http-repository";

export function createSystemConfigUseCases(repo: SystemConfigRepository) {
  return {
    params: () => guard(() => repo.params()),
    versions: () => guard(() => repo.versions()),
    saveParam: async (p: SystemParam, e: ParamEdit, isSuperAdmin: boolean) => {
      const blocker = paramBlocker(p, e, isSuperAdmin);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveParam(p.key, e));
    },
    saveVersion: async (d: AppVersionDraft) => {
      const blocker = versionBlocker(d);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveVersion(d));
    },
  };
}

export const systemConfigUseCases = createSystemConfigUseCases(new HttpSystemConfigRepository());
