import type { PricingZone, ProfileDetail, ProfileSummary, ZoneDraft } from "./pricing-profile";

export interface PricingProfilesRepository {
  profiles(): Promise<ProfileSummary[]>;
  profile(id: string): Promise<ProfileDetail>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
  removeProfile(id: string): Promise<void>;
  zones(): Promise<PricingZone[]>;
  createZone(d: ZoneDraft): Promise<void>;
  setZoneActive(id: string, active: boolean): Promise<void>;
  removeZone(id: string): Promise<void>;
}
