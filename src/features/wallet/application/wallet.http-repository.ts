import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Wallet, WalletMovement } from "../domain/wallet";
import type { WalletRepository } from "../domain/wallet.repository";

/** Élément de `GET /api/admin/wallets` (backend wami-co). */
export interface BackendWallet {
  walletId: string;
  walletType: "PAYMENT" | "EARNINGS" | "PARTNER" | "PLATFORM";
  totalBalance: number;
  status: string;
  withdrawalsBlocked: boolean;
  withdrawalsBlockedReason: string | null;
  ownerName: string;
  ownerPhone: string;
}

/** Élément de `GET /api/admin/transactions`. */
export interface BackendTransaction {
  transactionId: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  createdAt: string;
}

const OWNER: Record<BackendWallet["walletType"], Wallet["ownerType"]> = { PAYMENT: "client", EARNINGS: "partner", PARTNER: "partner", PLATFORM: "platform" };

export function toWallet(w: BackendWallet): Wallet {
  return {
    id: w.walletId,
    ownerName: w.ownerName || "—",
    ownerType: OWNER[w.walletType] ?? "client",
    phone: w.ownerPhone,
    balance: w.totalBalance,
    status: w.status === "ACTIVE" ? "active" : "frozen",
    withdrawalsBlocked: w.withdrawalsBlocked,
    withdrawalsBlockedReason: w.withdrawalsBlockedReason,
    movements: [],
  };
}

export function toMovement(t: BackendTransaction): WalletMovement {
  return { id: t.transactionId, at: t.createdAt, label: t.description, amount: t.direction === "DEBIT" ? -t.amount : t.amount };
}

export class HttpWalletRepository implements WalletRepository {
  async list(q: string) {
    const { wallets } = await http.get<{ wallets: BackendWallet[] }>(API.wallet.list);
    const needle = q.trim().toLowerCase();
    const all = wallets.map(toWallet);
    // Le backend n'a pas de recherche : filtre ici.
    return needle ? all.filter((w) => `${w.ownerName} ${w.phone}`.toLowerCase().includes(needle)) : all;
  }
  async movements(walletId: string) {
    const { transactions } = await http.get<{ transactions: BackendTransaction[] }>(API.wallet.transactions, { walletId, limit: 20 });
    return transactions.map(toMovement);
  }
  async blockWithdrawals(walletId: string, reason: string) {
    await http.patch(API.wallet.blockWithdrawals(walletId), { reason });
  }
  async unblockWithdrawals(walletId: string) {
    await http.patch(API.wallet.unblockWithdrawals(walletId));
  }
}
