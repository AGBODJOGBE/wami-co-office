import type { Referral, ReferralConfig, ReferralStats } from "./referral";

export interface ReferralsRepository {
  list(): Promise<Referral[]>;
  stats(): Promise<ReferralStats>;
  validate(id: string): Promise<void>;
  expire(id: string): Promise<void>;
  configs(): Promise<ReferralConfig[]>;
  activate(configId: string): Promise<void>;
  deactivate(configId: string): Promise<void>;
  remove(configId: string): Promise<void>;
}
