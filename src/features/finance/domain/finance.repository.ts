import type { FinanceSummary, PayoutBatch } from "./payout";

export interface FinanceRepository {
  summary(): Promise<FinanceSummary>;
  currentBatch(): Promise<PayoutBatch>;
  submit(selectedIds: string[]): Promise<PayoutBatch>;
  approve(): Promise<PayoutBatch>;
}
