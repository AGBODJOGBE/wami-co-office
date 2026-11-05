import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AppVersion, AppVersionDraft, ParamEdit, SystemParam } from "../domain/system-config";
import type { SystemConfigRepository } from "../domain/system-config.repository";

/** Élément de `GET /api/app-config/config` (backend wami-co). */
export interface BackendParam {
  key: string;
  value: string;
  type: string;
  description: string;
  updatedBy: string;
  version: number;
  updatedAt: string;
  forcedOutOfBounds: boolean;
  module?: string;
  label?: string;
  unit?: string;
  displayValue?: string;
  min?: number;
  max?: number;
  allowedValues?: string[];
  mustDivide?: number;
}

export const toParam = (p: BackendParam): SystemParam => ({
  key: p.key,
  label: p.label ?? p.key,
  module: p.module ?? "autre",
  description: p.description,
  value: p.value,
  display: p.displayValue ?? p.value,
  unit: p.unit ?? null,
  type: p.type,
  min: p.min ?? null,
  max: p.max ?? null,
  allowed: p.allowedValues ?? null,
  mustDivide: p.mustDivide ?? null,
  version: p.version,
  updatedBy: p.updatedBy,
  updatedAt: p.updatedAt,
  outOfBounds: p.forcedOutOfBounds,
});

export interface BackendVersion {
  id: string;
  appType: string;
  platform: string;
  packageId: string;
  latestVersion: string;
  latestBuild: number;
  minSupportedVersion: string;
  minSupportedBuild: number;
  forceUpdateAfter: string | null;
  downloadUrl: string;
  releaseNotes: string;
  updatedAt: string;
}

export const toVersion = (v: BackendVersion): AppVersion => ({
  id: v.id,
  appType: v.appType,
  platform: v.platform,
  packageId: v.packageId,
  latestVersion: v.latestVersion,
  latestBuild: v.latestBuild,
  minVersion: v.minSupportedVersion,
  minBuild: v.minSupportedBuild,
  forceUpdateAfter: v.forceUpdateAfter,
  downloadUrl: v.downloadUrl,
  releaseNotes: v.releaseNotes,
  updatedAt: v.updatedAt,
});

export class HttpSystemConfigRepository implements SystemConfigRepository {
  async params() {
    return (await http.get<BackendParam[]>(API.appConfig.params)).map(toParam);
  }
  async saveParam(key: string, e: ParamEdit) {
    await http.put(API.appConfig.param(key), { value: e.value, ...(e.force ? { force: true, justification: e.justification.trim() } : {}) });
  }
  async versions() {
    return (await http.get<BackendVersion[]>(API.appConfig.versions)).map(toVersion);
  }
  async saveVersion(d: AppVersionDraft) {
    await http.put(API.appConfig.version(d.appType, d.platform), {
      appType: d.appType,
      platform: d.platform,
      packageId: d.packageId.trim(),
      latestVersion: d.latestVersion,
      latestBuild: d.latestBuild,
      minSupportedVersion: d.minVersion,
      minSupportedBuild: d.minBuild,
      forceUpdateAfter: d.forceUpdateAfter,
      downloadUrl: d.downloadUrl.trim(),
      releaseNotes: d.releaseNotes,
    });
  }
}
