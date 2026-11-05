import type { Withdrawal, WithdrawalStatus } from "./withdrawal";

export interface WithdrawalsRepository {
  list(status: WithdrawalStatus | "all"): Promise<Withdrawal[]>;
  approve(id: string): Promise<void>;
  reject(id: string, reason: string): Promise<void>;
}
