import type { ConfigDraft } from "./config-draft";
import type { Referral, ReferralConfig, ReferralProgram, ReferralStats } from "./referral";

export interface ReferralsRepository {
  list(): Promise<Referral[]>;
  stats(): Promise<ReferralStats>;
  validate(id: string): Promise<void>;
  expire(id: string): Promise<void>;
  configs(): Promise<ReferralConfig[]>;
  createConfig(d: ConfigDraft): Promise<void>;
  updateConfig(configId: string, d: ConfigDraft): Promise<void>;
  activate(configId: string): Promise<void>;
  deactivate(configId: string): Promise<void>;
  remove(configId: string): Promise<void>;
  /** Routes absentes du backend : servies par le faux backend. */
  program(): Promise<ReferralProgram>;
  saveProgram(p: ReferralProgram): Promise<ReferralProgram>;
  flag(id: string, reason: string): Promise<void>;
}
