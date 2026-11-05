import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Grant, GrantDraft, GrantPreview, GrantStatus } from "../domain/grant";
import type { GrantsRepository } from "../domain/grants.repository";

/** Élément de `GET /api/admin/wallet/grants` (backend wami-co). */
export interface BackendGrant {
  campaignId: string;
  audience: "DRIVER" | "PASSENGER";
  label: string;
  balanceType: string;
  amountPerBeneficiary: number;
  beneficiaryCount: number;
  totalAmount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  creditedCount: number;
  failedCount: number;
}

export interface BackendPreview {
  beneficiaryCount: number;
  totalAmount: number;
  unknownIds: string[];
  beneficiariesInOverdraft: number;
  amountAbsorbedByDebt: number;
  capViolations: Array<{ cap: string; limit: number; actual: number }>;
  notes: string[];
}

const STATUS: Record<string, GrantStatus> = {
  PENDING_APPROVAL: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  PARTIALLY_FAILED: "partiallyFailed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};
const BACKEND_STATUS: Record<GrantStatus, string> = { pending: "PENDING_APPROVAL", approved: "APPROVED", completed: "COMPLETED", partiallyFailed: "PARTIALLY_FAILED", rejected: "REJECTED", cancelled: "CANCELLED" };

export function toGrant(g: BackendGrant): Grant {
  return {
    id: g.campaignId,
    label: g.label,
    audience: g.audience,
    balance: g.balanceType,
    amountEach: g.amountPerBeneficiary,
    beneficiaries: g.beneficiaryCount,
    total: g.totalAmount,
    status: STATUS[g.status] ?? "pending",
    createdBy: g.createdBy,
    createdAt: g.createdAt,
    approvedBy: g.approvedBy,
    credited: g.creditedCount,
    failed: g.failedCount,
  };
}

export function toPreview(p: BackendPreview): GrantPreview {
  return {
    beneficiaries: p.beneficiaryCount,
    total: p.totalAmount,
    unknownIds: p.unknownIds,
    inOverdraft: p.beneficiariesInOverdraft,
    absorbedByDebt: p.amountAbsorbedByDebt,
    violations: p.capViolations.map((v) => `${v.cap} : ${v.actual} > ${v.limit}`),
    notes: p.notes,
  };
}

const body = (d: GrantDraft) => ({
  audience: d.audience,
  label: d.label,
  balanceType: d.balance,
  amountPerBeneficiary: d.amountEach,
  targeting: { mode: "EXPLICIT", beneficiaryIds: d.beneficiaryIds },
});

export class HttpGrantsRepository implements GrantsRepository {
  async list(status: GrantStatus | "all") {
    const { campaigns } = await http.get<{ campaigns: BackendGrant[] }>(API.wallet.grants, { status: status === "all" ? undefined : BACKEND_STATUS[status], limit: 100 });
    return campaigns.map(toGrant);
  }
  async preview(d: GrantDraft) {
    return toPreview(await http.post<BackendPreview>(API.wallet.grantsPreview, body(d)));
  }
  async create(d: GrantDraft) {
    await http.post(API.wallet.grants, body(d));
  }
  async approve(id: string) {
    await http.post(API.wallet.approveGrant(id));
  }
  async reject(id: string, reason: string) {
    await http.post(API.wallet.rejectGrant(id), { reason });
  }
  async cancel(id: string) {
    await http.post(API.wallet.cancelGrant(id));
  }
  async retry(id: string) {
    await http.post(API.wallet.retryGrant(id));
  }
}
