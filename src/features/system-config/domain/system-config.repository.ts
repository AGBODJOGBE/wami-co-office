import type { AppVersion, AppVersionDraft, ParamEdit, SystemParam } from "./system-config";

export interface SystemConfigRepository {
  params(): Promise<SystemParam[]>;
  saveParam(key: string, e: ParamEdit): Promise<void>;
  versions(): Promise<AppVersion[]>;
  saveVersion(d: AppVersionDraft): Promise<void>;
}
