import { describe, expect, it } from "vitest";
import { discount, promoBlocker, type PromoCode } from "./promo-code";

const promo = (over: Partial<PromoCode> = {}): PromoCode => ({
  id: "p1",
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

describe("codes promo (backend wami-co)", () => {
  it("convertit un code du backend", async () => {
    const { toPromo } = await import("../application/promo-codes.http-repository");
    const p = toPromo({ id: "x1", code: "BIENVENUE", campaignName: "Accueil", discountType: "PERCENTAGE", discountValue: 50, maxDiscountAmount: 1000, startDate: "2026-11-01T00:00:00Z", endDate: "2026-11-30T00:00:00Z", maxTotalUsages: null, currentUsages: 3, vertical: "DELIVERY_B2C", fundedBy: "PARTNER", usageNumber: 1, isActive: true });
    expect(p).toMatchObject({ id: "x1", kind: "percent", cap: 1000, services: ["delivery"], fundedBy: "shared", firstOrderOnly: true, description: "Accueil" });
  });
  it("le corps de création garde les règles du backend", async () => {
    const { toCreateBody } = await import("../application/promo-codes.http-repository");
    expect(toCreateBody(promo({ kind: "fixed", value: 500, cap: null, firstOrderOnly: false }))).toMatchObject({ discountType: "FIXED_AMOUNT", userType: "ALL", usageNumber: null, vertical: "TRANSPORT", fundedBy: "WAMI" });
  });
});
