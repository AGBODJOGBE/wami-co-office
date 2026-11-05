import type { Wallet, WalletMovement } from "./wallet";

export interface WalletRepository {
  list(q: string): Promise<Wallet[]>;
  movements(walletId: string): Promise<WalletMovement[]>;
  blockWithdrawals(walletId: string, reason: string): Promise<void>;
  unblockWithdrawals(walletId: string): Promise<void>;
  /** Route absente du backend : servie par le faux backend. */
  adjust(walletId: string, amount: number, reason: string): Promise<void>;
}
