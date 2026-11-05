import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { PlatformSettings } from "../domain/settings";
import type { SettingsRepository } from "../domain/settings.repository";

export class HttpSettingsRepository implements SettingsRepository {
  get() {
    return http.get<PlatformSettings>(API.settings.platform);
  }
  save(s: PlatformSettings) {
    return http.put<PlatformSettings>(API.settings.platform, s);
  }
}
