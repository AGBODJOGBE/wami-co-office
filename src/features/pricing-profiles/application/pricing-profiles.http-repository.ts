import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { PricingZone, ProfileComponent, ProfileDetail, ProfileSummary, Strategy, ZoneDraft, ZoneType } from "../domain/pricing-profile";
import type { PricingProfilesRepository } from "../domain/pricing-profiles.repository";

export interface BackendProfile {
  profileId: string;
  serviceKey: string;
  vehicleType: string | null;
  name: string;
  description?: string | null;
  strategy: Strategy;
  isActive: boolean;
  version: number;
  updatedAt: string;
  commissionRate?: number;
  driverShareRate?: number;
  components?: Array<{ type: string; label: string; value?: number; rate?: number; threshold?: number; minimum?: number; tiers?: unknown[]; zones?: unknown[]; packages?: unknown[] }>;
}

export const toSummary = (p: BackendProfile): ProfileSummary => ({ id: p.profileId, service: p.serviceKey, vehicleType: p.vehicleType, name: p.name, strategy: p.strategy, active: p.isActive, version: p.version, updatedAt: p.updatedAt });

/** Résumé d'une composante : valeur simple, sinon nombre de paliers, zones ou forfaits. */
export function summarize(c: NonNullable<BackendProfile["components"]>[number]): string {
  const parts: string[] = [];
  if (c.value !== undefined) parts.push(String(c.value));
  if (c.rate !== undefined) parts.push(`taux ${c.rate}`);
  if (c.threshold !== undefined) parts.push(`seuil ${c.threshold}`);
  if (c.minimum !== undefined) parts.push(`minimum ${c.minimum}`);
  if (c.tiers?.length) parts.push(`${c.tiers.length} palier${c.tiers.length > 1 ? "s" : ""}`);
  if (c.zones?.length) parts.push(`${c.zones.length} zone${c.zones.length > 1 ? "s" : ""}`);
  if (c.packages?.length) parts.push(`${c.packages.length} forfait${c.packages.length > 1 ? "s" : ""}`);
  return parts.join(" · ") || "—";
}

export const toDetail = (p: BackendProfile): ProfileDetail => ({
  ...toSummary(p),
  description: p.description ?? null,
  commissionRate: p.commissionRate ?? 0,
  driverShareRate: p.driverShareRate ?? 0,
  components: (p.components ?? []).map((c): ProfileComponent => ({ type: c.type, label: c.label, summary: summarize(c) })),
});

interface BackendZone {
  zoneId: string;
  serviceKey: string;
  code: string;
  name: string;
  type: ZoneType;
  isActive: boolean;
}

export const toZone = (z: BackendZone): PricingZone => ({ id: z.zoneId, service: z.serviceKey, code: z.code, name: z.name, type: z.type, active: z.isActive });

export class HttpPricingProfilesRepository implements PricingProfilesRepository {
  async profiles() {
    return (await http.get<BackendProfile[]>(API.pricingAdmin.profiles)).map(toSummary);
  }
  async profile(id: string) {
    return toDetail(await http.get<BackendProfile>(API.pricingAdmin.profile(id)));
  }
  async activate(id: string) {
    await http.post(API.pricingAdmin.activateProfile(id));
  }
  async deactivate(id: string) {
    await http.post(API.pricingAdmin.deactivateProfile(id));
  }
  async removeProfile(id: string) {
    await http.delete(API.pricingAdmin.profile(id));
  }
  async zones() {
    return (await http.get<BackendZone[]>(API.pricingAdmin.zones)).map(toZone);
  }
  async createZone(d: ZoneDraft) {
    await http.post(API.pricingAdmin.zones, { serviceKey: d.service, code: d.code.trim().toUpperCase(), name: d.name.trim(), type: d.type });
  }
  async setZoneActive(id: string, active: boolean) {
    await http.patch(API.pricingAdmin.zone(id), { isActive: active });
  }
  async removeZone(id: string) {
    await http.delete(API.pricingAdmin.zone(id));
  }
}
