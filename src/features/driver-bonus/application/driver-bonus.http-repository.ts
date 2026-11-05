import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { BonusConfig, BonusDraft, TierDraft, BonusEntry, BonusFamily, BonusLedger, BonusRunConfig } from "../domain/bonus";
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
  return { id: c.id, family, name: c.name, description: c.description, vehicleCategory: c.vehicleCategory, active: c.isActive, rules: toRules(family, c), draft: toDraft(family, c) };
}

/** Contenu d'une configuration du backend sous forme de brouillon éditable. */
export function toDraft(family: BonusFamily, c: BackendBonusConfig): BonusDraft {
  const tiers: TierDraft[] = c.tiers.map((t) =>
    family === "tier" ? { name: "", threshold: t.ridesThreshold ?? 0, value: t.bonusAmount ?? 0 } : family === "activity" ? { name: t.name ?? "", threshold: t.ridesThresholdPerDay ?? 0, value: t.bonusPct ?? 0 } : { name: "", threshold: t.minRating ?? 0, value: t.bonusAmount ?? 0 },
  );
  return { family, name: c.name, description: c.description ?? "", vehicleCategory: c.vehicleCategory, minRidesPerMonth: c.minRidesPerMonth ?? 100, tiers };
}

/** Corps de création ou de modification d'une configuration de primes. */
export function toBody(d: BonusDraft, forUpdate: boolean) {
  const tiers = d.tiers.map((t) => (d.family === "tier" ? { ridesThreshold: t.threshold, bonusAmount: t.value } : d.family === "activity" ? { name: t.name.trim(), ridesThresholdPerDay: t.threshold, bonusPct: t.value } : { minRating: t.threshold, bonusAmount: t.value }));
  return {
    name: d.name.trim(),
    description: d.description.trim() || null,
    // La catégorie de véhicule se fixe à la création.
    ...(forUpdate ? {} : { vehicleCategory: d.vehicleCategory }),
    ...(d.family === "quality" ? { minRidesPerMonth: d.minRidesPerMonth } : {}),
    tiers,
  };
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
  async create(d: BonusDraft) {
    await http.post(base(d.family), toBody(d, false));
  }
  async update(c: BonusConfig, d: BonusDraft) {
    await http.put(`${base(c.family)}/${c.id}`, toBody({ ...d, family: c.family }, true));
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
