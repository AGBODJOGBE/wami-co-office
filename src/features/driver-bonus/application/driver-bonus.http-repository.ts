import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { BonusConfig, BonusEntry, BonusFamily, BonusLedger, BonusRunConfig } from "../domain/bonus";
import type { DriverBonusRepository } from "../domain/driver-bonus.repository";

/** Configuration renvoyée par `GET /api/admin/driver-bonus/{config,activity-config,quality-config}`. */
export interface BackendBonusConfig {
  id: string;
  name: string;
  description: string | null;
  vehicleCategory: string;
  isActive: boolean;
  minRidesPerMonth?: number;
  tiers: Array<{ ridesThreshold?: number; bonusAmount?: number; name?: string; ridesThresholdPerDay?: number; bonusPct?: number; minRating?: number }>;
}

const F = (n: number) => `${n.toLocaleString("fr-FR")} F`;

export function toRules(family: BonusFamily, c: BackendBonusConfig): string[] {
  if (family === "tier") return c.tiers.map((t) => `${t.ridesThreshold} courses → ${F(t.bonusAmount ?? 0)}`);
  if (family === "activity") return c.tiers.map((t) => `${t.name ? `${t.name} : ` : ""}${t.ridesThresholdPerDay} courses/jour → ${t.bonusPct} % du net`);
  return c.tiers.map((t) => `Note ≥ ${t.minRating} (min. ${c.minRidesPerMonth ?? 0} courses/mois) → ${F(t.bonusAmount ?? 0)}`);
}

export function toBonusConfig(family: BonusFamily, c: BackendBonusConfig): BonusConfig {
  return { id: c.id, family, name: c.name, description: c.description, vehicleCategory: c.vehicleCategory, active: c.isActive, rules: toRules(family, c) };
}

const base = (family: BonusFamily) => (family === "tier" ? API.driverBonus.tierConfigs : family === "activity" ? API.driverBonus.activityConfigs : API.driverBonus.qualityConfigs);

interface BackendEntry {
  id: string;
  driverId: string;
  vehicleCategory?: string;
  awardedAt?: string;
  activityDate?: string;
  yearMonth?: string;
  payoutRunDate?: string;
  createdAt?: string;
  ridesThreshold?: number;
  ridesCount?: number;
  averageRating?: number;
  bonusAmount?: number;
  totalAmount?: number;
}

export function toEntry(ledger: BonusLedger, e: BackendEntry): BonusEntry {
  const date = e.awardedAt ?? e.activityDate ?? e.payoutRunDate ?? e.createdAt ?? "";
  const label =
    ledger === "awards"
      ? `Palier ${e.ridesThreshold} courses (${e.vehicleCategory})`
      : ledger === "activityLedger"
        ? `${e.ridesCount} courses le ${e.activityDate} (${e.vehicleCategory})`
        : ledger === "activityPayouts"
          ? "Versement des primes d’activité"
          : `${e.yearMonth} : ${e.ridesCount} courses, note ${e.averageRating} (${e.vehicleCategory})`;
  return { id: e.id, driverId: e.driverId, date, label, amount: e.bonusAmount ?? e.totalAmount ?? 0 };
}

const LEDGER_ROUTE: Record<BonusLedger, string> = {
  awards: API.driverBonus.awards,
  activityLedger: API.driverBonus.activityLedger,
  activityPayouts: API.driverBonus.activityPayouts,
  qualityLedger: API.driverBonus.qualityLedger,
};

export class HttpDriverBonusRepository implements DriverBonusRepository {
  async configs(family: BonusFamily) {
    const rows = await http.get<BackendBonusConfig[]>(base(family));
    return rows.map((c) => toBonusConfig(family, c));
  }
  async activate(c: BonusConfig) {
    await http.post(`${base(c.family)}/${c.id}/activate`);
  }
  async deactivate(c: BonusConfig) {
    await http.post(`${base(c.family)}/${c.id}/deactivate`);
  }
  async remove(c: BonusConfig) {
    await http.delete(`${base(c.family)}/${c.id}`);
  }
  async entries(ledger: BonusLedger) {
    const rows = await http.get<BackendEntry[]>(LEDGER_ROUTE[ledger], { limit: 50 });
    return rows.map((e) => toEntry(ledger, e));
  }
  async runConfig() {
    const c = await http.get<BonusRunConfig>(API.driverBonus.runConfig);
    return { welcomeBonusEnabled: c.welcomeBonusEnabled, activityBonusEnabled: c.activityBonusEnabled, qualityBonusEnabled: c.qualityBonusEnabled, activityPayoutFrequency: c.activityPayoutFrequency };
  }
  async saveRunConfig(cfg: BonusRunConfig) {
    await http.put(API.driverBonus.runConfig, { welcomeBonusEnabled: cfg.welcomeBonusEnabled, activityBonusEnabled: cfg.activityBonusEnabled, qualityBonusEnabled: cfg.qualityBonusEnabled });
  }
}
