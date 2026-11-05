/** Paiements Mobile Money (recharges, retraits) passés par les prestataires FedaPay et MTN MoMo. */

export type PaymentStatus = "pending" | "success" | "failed" | "other";

export interface Payment {
  id: string;
  walletId: string;
  ownerName: string;
  phone: string;
  operation: string;
  provider: string;
  amount: number;
  status: PaymentStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface PaymentFilter {
  status: PaymentStatus | "all";
  provider: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = { pending: "En cours", success: "Réussi", failed: "Échoué", other: "Autre" };

export function statusOf(raw: string): PaymentStatus {
  const s = raw.toUpperCase();
  if (["SUCCESS", "SUCCEEDED", "COMPLETED", "APPROVED", "PAID"].includes(s)) return "success";
  if (["FAILED", "DECLINED", "CANCELLED", "EXPIRED", "REJECTED"].includes(s)) return "failed";
  if (["PENDING", "PROCESSING", "INITIATED", "CREATED"].includes(s)) return "pending";
  return "other";
}

export function totals(rows: Payment[]) {
  const success = rows.filter((p) => p.status === "success");
  const failed = rows.filter((p) => p.status === "failed").length;
  return { count: rows.length, amount: success.reduce((s, p) => s + p.amount, 0), failureRate: rows.length ? failed / rows.length : 0 };
}
