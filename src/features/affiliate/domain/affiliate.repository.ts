import type { Affiliate, SuspensionMode } from "./affiliate";

export interface AffiliateRepository {
  list(): Promise<Affiliate[]>;
  suspend(id: string, mode: SuspensionMode, reason: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  close(id: string, reason: string): Promise<void>;
  reopen(id: string, reason: string): Promise<void>;
  setCommissionRate(id: string, rate: number | null): Promise<void>;
  /** Route absente du backend : servie par le faux backend. */
  pay(id: string, amount: number): Promise<void>;
}
