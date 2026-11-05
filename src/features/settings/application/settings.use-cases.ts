import { fail, guard, type Result } from "@/shared/lib/result";
import { settingsBlocker, type PlatformSettings } from "../domain/settings";
import type { SettingsRepository } from "../domain/settings.repository";
import { HttpSettingsRepository } from "./settings.http-repository";

export function createSettingsUseCases(repo: SettingsRepository) {
  return {
    get: () => guard(() => repo.get()),
    save: (s: PlatformSettings): Promise<Result<PlatformSettings>> => {
      const blocker = settingsBlocker(s);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.save({ ...s, sosPhone: s.sosPhone.trim() }));
    },
  };
}

export const settingsUseCases = createSettingsUseCases(new HttpSettingsRepository());
