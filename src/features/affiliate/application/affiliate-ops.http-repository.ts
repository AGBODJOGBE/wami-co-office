import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AffiliateConfig, AffiliateStatement, CommissionLine, CommissionSkip, Eligibility, EligibilityResult, NewAffiliate } from "../domain/affiliate-ops";
import type { AffiliateOpsRepository } from "../domain/affiliate-ops.repository";

const ELIGIBILITY: Record<string, Eligibility> = { ELIGIBLE: "eligible", NO_ACCOUNT: "noAccount", NO_PASSENGER_PROFILE: "noPassengerProfile", ALREADY_AFFILIATE: "alreadyAffiliate" };

export interface BackendStatement {
  suspensionReason?: string | null;
  statement: {
    byStatus: Array<{ status: string; count: number; totalAmount: number }>;
    totals: { totalAccrued: number; totalPaid: number; outstandingPayable: number; heldOutstanding: number };
    walletBalance: { affiliateBalance: number } | null;
    lines: Array<{ commissionId: string; sourceType: string; amount: number; payableAmount: number; paidAmount: number; outstandingPayableAmount: number; appliedRate: number; status: string; accruedAt: string; held: boolean }>;
  };
}

export const toStatement = (r: BackendStatement): AffiliateStatement => ({
  totalAccrued: r.statement.totals.totalAccrued,
  totalPaid: r.statement.totals.totalPaid,
  outstanding: r.statement.totals.outstandingPayable,
  heldOutstanding: r.statement.totals.heldOutstanding,
  walletBalance: r.statement.walletBalance?.affiliateBalance ?? null,
  breakdown: r.statement.byStatus.map((b) => ({ status: b.status, count: b.count, amount: b.totalAmount })),
  lines: r.statement.lines.map(
    (l): CommissionLine => ({ id: l.commissionId, source: l.sourceType, amount: l.amount, payable: l.payableAmount, paid: l.paidAmount, outstanding: l.outstandingPayableAmount, rate: l.appliedRate, status: l.status, accruedAt: l.accruedAt, held: l.held }),
  ),
  suspensionReason: r.suspensionReason ?? null,
});

export interface BackendSkip {
  skipId: string;
  affiliateId: string;
  reason: string;
  sourceType: string;
  platformCommission: number;
  potentialAmount: number | null;
  appliedAt: string;
  resolvedAt: string | null;
}

export const toSkip = (s: BackendSkip): CommissionSkip => ({ id: s.skipId, affiliateId: s.affiliateId, reason: s.reason, source: s.sourceType, platformCommission: s.platformCommission, potential: s.potentialAmount, appliedAt: s.appliedAt, resolved: s.resolvedAt !== null });

export class HttpAffiliateOpsRepository implements AffiliateOpsRepository {
  async config() {
    return http.get<AffiliateConfig>(API.affiliate.config).then((c) => ({ defaultCommissionRate: c.defaultCommissionRate, minPayoutAmount: c.minPayoutAmount }));
  }
  async saveConfig(c: AffiliateConfig) {
    await http.patch(API.affiliate.config, c);
  }
  async eligibility(phone: string): Promise<EligibilityResult> {
    const r = await http.get<{ status: string; displayName: string | null }>(API.affiliate.eligibility, { phoneNumber: phone.trim() });
    return { status: ELIGIBILITY[r.status] ?? "noAccount", displayName: r.displayName };
  }
  async create(a: NewAffiliate) {
    await http.post(API.affiliate.create, { phoneNumber: a.phoneNumber.trim(), name: a.name.trim(), socialNetwork: a.socialNetwork.trim(), audienceSize: a.audienceSize, commissionRate: a.commissionRate });
  }
  async statement(affiliateId: string) {
    return toStatement(await http.get<BackendStatement>(API.affiliate.detail(affiliateId), { limit: 50 }));
  }
  async hold(commissionId: string, reason: string) {
    await http.post(API.affiliate.holdCommission(commissionId), { reason });
  }
  async release(commissionId: string) {
    await http.post(API.affiliate.releaseCommission(commissionId));
  }
  async cancel(commissionId: string, reason: string) {
    await http.post(API.affiliate.cancelCommission(commissionId), { reason });
  }
  async skips() {
    const r = await http.get<{ items: BackendSkip[] }>(API.affiliate.commissionSkips, { limit: 50 });
    return r.items.map(toSkip);
  }
}
