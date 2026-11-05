import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Withdrawal, WithdrawalStatus } from "../domain/withdrawal";
import type { WithdrawalsRepository } from "../domain/withdrawals.repository";

/** Élément de `GET /api/admin/withdrawals` (backend wami-co). */
export interface BackendWithdrawal {
  withdrawalId: string;
  walletId: string;
  ownerName: string;
  ownerPhone: string;
  amount: number;
  method: string;
  recipientDetails: { phone?: string; iban?: string; bankName?: string; accountName?: string };
  status: string;
  reference: string | null;
  failureReason: string | null;
  rejectionReason: string | null;
  sourceBalance: string;
  affiliateSummary: { outstandingPayable: number } | null;
  createdAt: string;
}

const STATUS: Record<string, WithdrawalStatus> = {
  AWAITING_APPROVAL: "awaiting",
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};
const BACKEND_STATUS: Record<WithdrawalStatus, string> = { awaiting: "AWAITING_APPROVAL", pending: "PENDING", processing: "PROCESSING", completed: "COMPLETED", failed: "FAILED", cancelled: "CANCELLED", rejected: "REJECTED" };

export function recipientOf(r: BackendWithdrawal["recipientDetails"]): string {
  if (r.phone) return r.phone;
  return [r.bankName, r.accountName, r.iban].filter(Boolean).join(" · ") || "—";
}

export function toWithdrawal(w: BackendWithdrawal): Withdrawal {
  return {
    id: w.withdrawalId,
    walletId: w.walletId,
    ownerName: w.ownerName || "—",
    phone: w.ownerPhone,
    amount: w.amount,
    method: w.method,
    recipient: recipientOf(w.recipientDetails ?? {}),
    status: STATUS[w.status] ?? "pending",
    source: w.sourceBalance,
    reference: w.reference,
    failureReason: w.failureReason,
    rejectionReason: w.rejectionReason,
    createdAt: w.createdAt,
    affiliateOutstanding: w.affiliateSummary?.outstandingPayable ?? null,
  };
}

export class HttpWithdrawalsRepository implements WithdrawalsRepository {
  async list(status: WithdrawalStatus | "all") {
    const { withdrawals } = await http.get<{ withdrawals: BackendWithdrawal[] }>(API.wallet.withdrawals, { status: status === "all" ? undefined : BACKEND_STATUS[status], limit: 100 });
    return withdrawals.map(toWithdrawal);
  }
  async approve(id: string) {
    await http.patch(API.wallet.approveWithdrawal(id));
  }
  async reject(id: string, reason: string) {
    await http.patch(API.wallet.rejectWithdrawal(id), { reason });
  }
}
