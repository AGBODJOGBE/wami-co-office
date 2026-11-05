import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Referral, ReferralConfig, ReferralStats, ReferralStatus } from "../domain/referral";
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
  rewardMatrix: Array<{ referrerType: string; referredType: string; rewardMode: "FIXED" | "PERCENTAGE"; referrerAmount: number; referredAmount: number }>;
  validationConditions: { expirationDays: number | null };
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
  async activate(configId: string) {
    await http.post(API.referrals.activateConfig(configId));
  }
  async deactivate(configId: string) {
    await http.post(API.referrals.deactivateConfig(configId));
  }
  async remove(configId: string) {
    await http.delete(API.referrals.config(configId));
  }
}
