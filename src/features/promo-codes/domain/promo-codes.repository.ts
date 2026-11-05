import type { PromoCode } from "./promo-code";

export interface PromoCodesRepository {
  list(): Promise<PromoCode[]>;
  create(p: PromoCode): Promise<void>;
  /** Le backend n'expose qu'une bascule : on l'appelle seulement si l'état doit changer. */
  toggle(p: PromoCode): Promise<void>;
}
