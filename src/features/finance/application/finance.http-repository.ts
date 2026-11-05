import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { FinanceSummary, PayoutBatch } from "../domain/payout";
import type { FinanceRepository } from "../domain/finance.repository";

export class HttpFinanceRepository implements FinanceRepository {
  summary() {
    return http.get<FinanceSummary>(API.finance.summary);
  }
  currentBatch() {
    return http.get<PayoutBatch>(API.finance.batch);
  }
  submit(selectedIds: string[]) {
    return http.post<PayoutBatch>(API.finance.submitBatch, { selectedIds });
  }
  approve() {
    return http.post<PayoutBatch>(API.finance.approveBatch);
  }
}
