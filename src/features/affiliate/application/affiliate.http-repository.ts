import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Affiliate, AffiliateStatus, SuspensionMode } from "../domain/affiliate";
import type { AffiliateRepository } from "../domain/affiliate.repository";

/** Élément de `GET /api/admin/affiliates` (backend wami-co). */
export interface BackendAffiliate {
  affiliateId: string;
  name: string;
  phoneNumber: string;
  socialNetwork: string;
  audienceSize: number | null;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  commissionRate: number | null;
  effectiveCommissionRate: number;
  totalPayable: number;
  totalPaid: number;
  outstandingPayable: number;
  codes: Array<{ code: string; currentUsages: number; isCurrentlyUsable: boolean }>;
}

const STATUS: Record<BackendAffiliate["status"], AffiliateStatus> = { ACTIVE: "active", SUSPENDED: "suspended", CLOSED: "closed" };

export function toAffiliate(a: BackendAffiliate): Affiliate {
  return {
    id: a.affiliateId,
    name: a.name,
    phone: a.phoneNumber,
    socialNetwork: a.socialNetwork,
    audienceSize: a.audienceSize,
    status: STATUS[a.status] ?? "active",
    commissionRate: a.commissionRate,
    effectiveCommissionRate: a.effectiveCommissionRate,
    accrued: a.totalPayable,
    paid: a.totalPaid,
    outstanding: a.outstandingPayable,
    codes: a.codes.map((c) => ({ code: c.code, usages: c.currentUsages, usable: c.isCurrentlyUsable })),
  };
}

export class HttpAffiliateRepository implements AffiliateRepository {
  async list() {
    const rows = await http.get<BackendAffiliate[]>(API.affiliate.list);
    return rows.map(toAffiliate);
  }
  async suspend(id: string, mode: SuspensionMode, reason: string) {
    await http.post(API.affiliate.suspend(id), { mode: mode === "pause" ? "PAUSE" : "SANCTION", reason: reason || undefined });
  }
  async reactivate(id: string) {
    await http.post(API.affiliate.reactivate(id));
  }
  async close(id: string, reason: string) {
    await http.post(API.affiliate.close(id), { reason });
  }
  async reopen(id: string, reason: string) {
    await http.post(API.affiliate.reopen(id), { reason });
  }
  async setCommissionRate(id: string, rate: number | null) {
    await http.patch(API.affiliate.commissionRate(id), { commissionRate: rate });
  }
  async pay(id: string, amount: number) {
    await http.post(API.affiliate.pay(id), { amount });
  }
}
