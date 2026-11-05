import type { Wallet } from "./wallet";

export interface WalletRepository {
  list(q: string): Promise<Wallet[]>;
  adjust(walletId: string, amount: number, reason: string): Promise<Wallet>;
}
