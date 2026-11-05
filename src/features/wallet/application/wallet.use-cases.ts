import { fail, guard, type Result } from "@/shared/lib/result";
import { adjustmentBlocker, type Wallet } from "../domain/wallet";
import type { WalletRepository } from "../domain/wallet.repository";
import { HttpWalletRepository } from "./wallet.http-repository";

export function createWalletUseCases(repo: WalletRepository) {
  return {
    list: (q: string) => guard(() => repo.list(q)),
    adjust: (w: Wallet, amount: number, reason: string, isSuperAdmin: boolean): Promise<Result<Wallet>> => {
      const blocker = adjustmentBlocker(w, amount, reason, isSuperAdmin);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.adjust(w.id, amount, reason.trim()));
    },
  };
}

export const walletUseCases = createWalletUseCases(new HttpWalletRepository());
