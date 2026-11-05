import type { LeaseContract, LeaseInstallment, PaymentMethod } from "./lease-contract";

export interface ContractsRepository {
  list(): Promise<LeaseContract[]>;
  installments(contractId: string): Promise<LeaseInstallment[]>;
  recordPayment(contractId: string, amount: number, method: PaymentMethod, reference: string): Promise<void>;
  suspend(contractId: string, reason: string): Promise<void>;
  resume(contractId: string): Promise<void>;
  breakContract(contractId: string, reason: string): Promise<void>;
}
