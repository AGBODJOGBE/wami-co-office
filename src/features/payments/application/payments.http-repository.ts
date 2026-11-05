import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import { statusOf, type Payment, type PaymentFilter } from "../domain/payment";
import type { PaymentsRepository } from "../domain/payments.repository";

/** Élément de `GET /api/admin/payments/intents` (backend wami-co). */
export interface BackendPayment {
  paymentIntentId: string;
  walletId: string;
  ownerName: string;
  ownerPhone: string;
  operationType: string;
  status: string;
  provider: string;
  amount: number;
  phone: string | null;
  failureReason: string | null;
  createdAt: string;
}

export const toPayment = (p: BackendPayment): Payment => ({
  id: p.paymentIntentId,
  walletId: p.walletId,
  ownerName: p.ownerName || "—",
  phone: p.phone ?? p.ownerPhone,
  operation: p.operationType,
  provider: p.provider,
  amount: p.amount,
  status: statusOf(p.status),
  failureReason: p.failureReason,
  createdAt: p.createdAt,
});

export class HttpPaymentsRepository implements PaymentsRepository {
  async list(f: PaymentFilter) {
    const { intents } = await http.get<{ intents: BackendPayment[] }>(API.payments.intents, { provider: f.provider || undefined });
    const rows = intents.map(toPayment);
    // Le statut du backend est un texte libre : le filtre se fait après conversion.
    return f.status === "all" ? rows : rows.filter((p) => p.status === f.status);
  }
}
