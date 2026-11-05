import type { AffiliateConfig, AffiliateStatement, CommissionSkip, EligibilityResult, NewAffiliate } from "./affiliate-ops";

export interface AffiliateOpsRepository {
  config(): Promise<AffiliateConfig>;
  saveConfig(c: AffiliateConfig): Promise<void>;
  eligibility(phone: string): Promise<EligibilityResult>;
  create(a: NewAffiliate): Promise<void>;
  statement(affiliateId: string): Promise<AffiliateStatement>;
  hold(commissionId: string, reason: string): Promise<void>;
  release(commissionId: string): Promise<void>;
  cancel(commissionId: string, reason: string): Promise<void>;
  skips(): Promise<CommissionSkip[]>;
}
