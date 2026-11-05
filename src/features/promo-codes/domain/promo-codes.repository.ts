import type { PromoCode } from "./promo-code";

export interface PromoCodesRepository {
  list(): Promise<PromoCode[]>;
  create(p: PromoCode): Promise<PromoCode>;
  setActive(code: string, active: boolean): Promise<PromoCode>;
}
