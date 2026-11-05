import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { LeaseContract, LeasePayment } from "../domain/lease-contract";
import type { ContractsRepository } from "../domain/contracts.repository";

export class HttpContractsRepository implements ContractsRepository {
  list() {
    return http.get<LeaseContract[]>(API.contracts.list);
  }
  recordPayment(contractId: string, amount: number, method: LeasePayment["method"]) {
    return http.post<LeaseContract>(API.contracts.payments(contractId), { amount, method });
  }
}
