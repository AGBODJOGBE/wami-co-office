import type { Affiliate } from "./affiliate";

export interface AffiliateRepository {
  list(): Promise<Affiliate[]>;
  pay(id: string, amount: number): Promise<Affiliate>;
}
