import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import { PROFILE_TYPES, defaultDraft, type ConfigDraft, type ProfileType } from "../domain/config-draft";
import type { Referral, ReferralConfig, ReferralProgram, ReferralStats, ReferralStatus } from "../domain/referral";
import type { ReferralsRepository } from "../domain/referrals.repository";

/** Élément de `GET /api/admin/referrals` (backend wami-co). */
export interface BackendReferral {
  referralId: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  referralType: string;
  status: "PENDING" | "VALIDATED" | "EXPIRED";
  referrerReward: number;
  referredReward: number;
  validatedAt: string | null;
  createdAt: string;
}

export interface BackendReferralConfig {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rewardMatrix: Array<{ referrerType: string; referredType: string; rewardMode: "FIXED" | "PERCENTAGE"; referrerAmount: number; referredAmount: number; referrerCap?: number | null; referredCap?: number | null }>;
  limits?: { perType: Array<{ referredType: string; maxPerMonth: number; maxPerDay: number }>; maxReferralsPerDayGlobal: number | null };
  validationConditions: { expirationDays: number | null; perType?: Array<{ referredType: string; actionsRequired: number; actionType: string }> };
  activatedAt: string | null;
}

const STATUS: Record<BackendReferral["status"], ReferralStatus> = { PENDING: "pending", VALIDATED: "validated", EXPIRED: "expired" };

export function toReferral(r: BackendReferral): Referral {
  return {
    id: r.referralId,
    referrerId: r.referrerId,
    refereeId: r.referredUserId,
    code: r.referralCode,
    type: r.referralType,
    status: STATUS[r.status],
    referrerReward: r.referrerReward,
    refereeReward: r.referredReward,
    validatedAt: r.validatedAt,
    createdAt: r.createdAt,
  };
}

export function toConfig(c: BackendReferralConfig): ReferralConfig {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    active: c.isActive,
    expirationDays: c.validationConditions.expirationDays,
    rules: c.rewardMatrix.map((e) => ({ referrerType: e.referrerType, referredType: e.referredType, mode: e.rewardMode === "FIXED" ? "fixed" : "percentage", referrerAmount: e.referrerAmount, referredAmount: e.referredAmount })),
    activatedAt: c.activatedAt,
    draft: toDraft(c),
  };
}

const known = (t: string): t is ProfileType => (PROFILE_TYPES as readonly string[]).includes(t);

/** Contenu d'une configuration du backend sous forme de brouillon éditable. */
export function toDraft(c: BackendReferralConfig): ConfigDraft {
  const d = defaultDraft();
  return {
    name: c.name,
    description: c.description ?? "",
    rules: d.rules.map((base) => {
      const e = c.rewardMatrix.find((x) => x.referrerType === base.referrerType && x.referredType === base.referredType);
      return e ? { ...base, mode: e.rewardMode, referrerAmount: e.referrerAmount, referredAmount: e.referredAmount, referrerCap: e.referrerCap ?? null, referredCap: e.referredCap ?? null } : base;
    }),
    limits: d.limits.map((base) => c.limits?.perType.find((x) => x.referredType === base.referredType) ?? base).map((l) => ({ referredType: l.referredType as ProfileType, maxPerMonth: l.maxPerMonth, maxPerDay: l.maxPerDay })).filter((l) => known(l.referredType)),
    globalMaxPerDay: c.limits?.maxReferralsPerDayGlobal ?? null,
    conditions: d.conditions.map((base) => {
      const e = c.validationConditions.perType?.find((x) => x.referredType === base.referredType);
      return e ? { referredType: base.referredType, actionsRequired: e.actionsRequired, actionType: e.actionType as ConfigDraft["conditions"][number]["actionType"] } : base;
    }),
    expirationDays: c.validationConditions.expirationDays,
  };
}

/** Corps de `POST /api/admin/referrals/config` et `PUT …/:id`. */
export function toConfigBody(d: ConfigDraft) {
  return {
    name: d.name.trim(),
    description: d.description.trim() || null,
    rewardMatrix: d.rules.map((r) => ({ referrerType: r.referrerType, referredType: r.referredType, rewardMode: r.mode, referrerAmount: r.referrerAmount, referredAmount: r.referredAmount, referrerCap: r.mode === "FIXED" ? null : r.referrerCap, referredCap: r.mode === "FIXED" ? null : r.referredCap })),
    limits: { perType: d.limits, maxReferralsPerDayGlobal: d.globalMaxPerDay },
    validationConditions: { perType: d.conditions, expirationDays: d.expirationDays },
  };
}

export class HttpReferralsRepository implements ReferralsRepository {
  async list() {
    const rows = await http.get<BackendReferral[]>(API.referrals.list, { limit: 100 });
    return rows.map(toReferral);
  }
  async stats() {
    const s = await http.get<{ totalReferrals: number; validatedReferrals: number; pendingReferrals: number; expiredReferrals: number; totalRewardsGiven: number }>(API.referrals.stats);
    return { total: s.totalReferrals, validated: s.validatedReferrals, pending: s.pendingReferrals, expired: s.expiredReferrals, totalRewards: s.totalRewardsGiven } satisfies ReferralStats;
  }
  async validate(id: string) {
    await http.post(API.referrals.validate(id));
  }
  async expire(id: string) {
    await http.post(API.referrals.expire(id));
  }
  async configs() {
    const rows = await http.get<BackendReferralConfig[]>(API.referrals.configs);
    return rows.map(toConfig);
  }
  async createConfig(d: ConfigDraft) {
    await http.post(API.referrals.configs, toConfigBody(d));
  }
  async updateConfig(configId: string, d: ConfigDraft) {
    await http.put(API.referrals.config(configId), toConfigBody(d));
  }
  async activate(configId: string) {
    await http.post(API.referrals.activateConfig(configId));
  }
  async deactivate(configId: string) {
    await http.post(API.referrals.deactivateConfig(configId));
  }
  async remove(configId: string) {
    await http.delete(API.referrals.config(configId));
  }
  program() {
    return http.get<ReferralProgram>(API.referrals.program);
  }
  saveProgram(p: ReferralProgram) {
    return http.put<ReferralProgram>(API.referrals.program, p);
  }
  async flag(id: string, reason: string) {
    await http.post(API.referrals.flag(id), { reason });
  }
}
