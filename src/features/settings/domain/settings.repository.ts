import type { PlatformSettings } from "./settings";

export interface SettingsRepository {
  get(): Promise<PlatformSettings>;
  save(s: PlatformSettings): Promise<PlatformSettings>;
}
