import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Wallet } from "../domain/wallet";
import type { WalletRepository } from "../domain/wallet.repository";

export class HttpWalletRepository implements WalletRepository {
  list(q: string) {
    return http.get<Wallet[]>(API.wallet.list, { q });
  }
  adjust(walletId: string, amount: number, reason: string) {
    return http.post<Wallet>(API.wallet.adjust(walletId), { amount, reason });
  }
}
