import { describe, expect, it } from "vitest";
import { discount, promoBlocker, type PromoCode } from "./promo-code";

const promo = (over: Partial<PromoCode> = {}): PromoCode => ({
  code: "BIENVENUE",
  description: "",
  kind: "percent",
  value: 50,
  cap: 1000,
  maxUses: 100,
  used: 0,
  services: ["ride"],
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: "2026-11-30T00:00:00Z",
  fundedBy: "wami",
  firstOrderOnly: true,
  active: true,
  ...over,
});

describe("codes promo", () => {
  it("pourcentage plafonné", () => {
    expect(discount(promo(), 1500)).toBe(750);
    expect(discount(promo(), 5000)).toBe(1000);
  });

  it("jamais plus que la commande", () => {
    expect(discount(promo({ kind: "fixed", value: 2000, cap: null }), 1200)).toBe(1200);
  });

  it("un pourcentage sans plafond est refusé", () => {
    expect(promoBlocker(promo({ cap: null }), [])).toMatch(/plafond/);
    expect(promoBlocker(promo(), [])).toBeNull();
  });
});
