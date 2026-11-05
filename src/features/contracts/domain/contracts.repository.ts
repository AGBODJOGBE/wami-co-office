import type { LeaseContract, LeasePayment } from "./lease-contract";

export interface ContractsRepository {
  list(): Promise<LeaseContract[]>;
  recordPayment(contractId: string, amount: number, method: LeasePayment["method"]): Promise<LeaseContract>;
}
