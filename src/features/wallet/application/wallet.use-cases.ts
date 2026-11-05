import { fail, guard } from "@/shared/lib/result";
import { adjustmentBlocker, blockBlocker, unblockBlocker, type Wallet } from "../domain/wallet";
import type { WalletRepository } from "../domain/wallet.repository";
import { HttpWalletRepository } from "./wallet.http-repository";

export function createWalletUseCases(repo: WalletRepository) {
  return {
    list: (q: string) => guard(() => repo.list(q)),
    movements: (walletId: string) => guard(() => repo.movements(walletId)),
    blockWithdrawals: async (w: Wallet, reason: string) => {
      const blocker = blockBlocker(w, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.blockWithdrawals(w.id, reason.trim()));
    },
    adjust: async (w: Wallet, amount: number, reason: string, isSuperAdmin: boolean) => {
      const blocker = adjustmentBlocker(w, amount, reason, isSuperAdmin);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.adjust(w.id, amount, reason.trim()));
    },
    unblockWithdrawals: async (w: Wallet) => {
      const blocker = unblockBlocker(w);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.unblockWithdrawals(w.id));
    },
  };
}

export const walletUseCases = createWalletUseCases(new HttpWalletRepository());
