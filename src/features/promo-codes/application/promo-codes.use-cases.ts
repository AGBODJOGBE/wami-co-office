import { fail, guard, type Result } from "@/shared/lib/result";
import { promoBlocker, type PromoCode } from "../domain/promo-code";
import type { PromoCodesRepository } from "../domain/promo-codes.repository";
import { HttpPromoCodesRepository } from "./promo-codes.http-repository";

export function createPromoCodesUseCases(repo: PromoCodesRepository) {
  return {
    list: () => guard(() => repo.list()),
    create: async (p: PromoCode, existing: PromoCode[]): Promise<Result<void>> => {
      const normalized = { ...p, code: p.code.trim().toUpperCase(), used: 0 };
      const blocker = promoBlocker(normalized, existing);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.create(normalized));
    },
    toggle: (p: PromoCode) => guard(() => repo.toggle(p)),
  };
}

export const promoCodesUseCases = createPromoCodesUseCases(new HttpPromoCodesRepository());
