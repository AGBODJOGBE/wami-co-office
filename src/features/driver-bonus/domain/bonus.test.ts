import { describe, expect, it } from "vitest";
import { toBonusConfig, toEntry, toRules, type BackendBonusConfig } from "../application/driver-bonus.http-repository";
import { activateBlocker, deleteBlocker } from "./bonus";

const tier: BackendBonusConfig = { id: "t1", name: "Paliers", description: null, vehicleCategory: "MOTO", isActive: true, tiers: [{ ridesThreshold: 50, bonusAmount: 5000 }] };

describe("primes chauffeurs (backend wami-co)", () => {
  it("décrit les règles de chaque famille", () => {
    expect(toRules("tier", tier)[0]).toMatch(/^50 courses → 5.000 F$/u);
    expect(toRules("activity", { ...tier, tiers: [{ name: "Bronze", ridesThresholdPerDay: 10, bonusPct: 2 }] })[0]).toBe("Bronze : 10 courses/jour → 2 % du net");
    expect(toRules("quality", { ...tier, minRidesPerMonth: 100, tiers: [{ minRating: 4.5, bonusAmount: 5000 }] })[0]).toContain("Note ≥ 4.5 (min. 100 courses/mois)");
  });
  it("convertit une configuration et une ligne d'historique", () => {
    expect(toBonusConfig("tier", tier)).toMatchObject({ id: "t1", family: "tier", active: true });
    expect(toEntry("awards", { id: "a", driverId: "d", vehicleCategory: "MOTO", ridesThreshold: 50, bonusAmount: 5000, awardedAt: "2026-11-01T00:00:00Z" })).toMatchObject({ amount: 5000, date: "2026-11-01T00:00:00Z" });
  });
  it("une configuration active ne se supprime ni ne se réactive", () => {
    const c = toBonusConfig("tier", tier);
    expect(deleteBlocker(c)).not.toBeNull();
    expect(activateBlocker(c)).not.toBeNull();
    expect(deleteBlocker({ ...c, active: false })).toBeNull();
  });
});

describe("configuration de primes : brouillon", () => {
  it("brouillons valides par famille et règles propres à chacune", async () => {
    const { draftBlocker, emptyDraft } = await import("./bonus");
    const ok = (family: "tier" | "activity" | "quality") => ({ ...emptyDraft(family), name: "Test" });
    expect(draftBlocker(ok("tier"))).toBeNull();
    expect(draftBlocker(ok("activity"))).toBeNull();
    expect(draftBlocker(ok("quality"))).toBeNull();
    expect(draftBlocker({ ...ok("tier"), name: "x" })).toMatch(/Nom/);
    expect(draftBlocker({ ...ok("tier"), tiers: [] })).toMatch(/palier/);
    expect(draftBlocker({ ...ok("tier"), tiers: [{ name: "", threshold: 50, value: 1000 }, { name: "", threshold: 50, value: 2000 }] })).toMatch(/même seuil/);
    expect(draftBlocker({ ...ok("activity"), tiers: [{ name: "", threshold: 10, value: 2 }] })).toMatch(/nom/);
    expect(draftBlocker({ ...ok("activity"), tiers: [{ name: "A", threshold: 10, value: 150 }] })).toMatch(/pourcentage/);
    expect(draftBlocker({ ...ok("quality"), tiers: [{ name: "", threshold: 6, value: 1000 }] })).toMatch(/note/);
    expect(draftBlocker({ ...ok("quality"), minRidesPerMonth: 0 })).toMatch(/Courses minimales/);
  });
  it("corps de requête : catégorie seulement à la création, minRides pour la qualité", async () => {
    const { toBody, toDraft } = await import("../application/driver-bonus.http-repository");
    const { emptyDraft } = await import("./bonus");
    const d = { ...emptyDraft("quality"), name: " Qualité " };
    expect(toBody(d, false)).toMatchObject({ name: "Qualité", vehicleCategory: "ALL", minRidesPerMonth: 100, tiers: [{ minRating: 4.5, bonusAmount: 5000 }] });
    expect(toBody(d, true)).not.toHaveProperty("vehicleCategory");
    expect(toDraft("activity", { id: "a", name: "x", description: null, vehicleCategory: "MOTO", isActive: true, tiers: [{ name: "Bronze", ridesThresholdPerDay: 10, bonusPct: 2 }] }).tiers).toEqual([{ name: "Bronze", threshold: 10, value: 2 }]);
  });
});
