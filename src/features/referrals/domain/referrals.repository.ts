import type { Referral, ReferralProgram } from "./referral";

export interface ReferralsRepository {
  program(): Promise<ReferralProgram>;
  saveProgram(p: ReferralProgram): Promise<ReferralProgram>;
  list(): Promise<Referral[]>;
  flag(id: string, reason: string): Promise<Referral>;
}
