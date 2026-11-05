import type { AuditLine, FleetKpis, RevenueShareAlert, Withholding } from "./contract-ops";

export interface ContractOpsRepository {
  kpis(): Promise<FleetKpis>;
  audit(): Promise<AuditLine[]>;
  alerts(): Promise<RevenueShareAlert[]>;
  withholdings(contractId: string): Promise<Withholding[]>;
  switchToRevenueShare(contractId: string, rate: number): Promise<void>;
  updateRate(contractId: string, rate: number): Promise<void>;
  unblockDriver(driverId: string): Promise<void>;
}
