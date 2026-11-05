import { describe, expect, it } from "vitest";
import { toConfig, toReferral } from "../application/referrals.http-repository";
import { activateBlocker, deleteBlocker, validateBlocker } from "./referral";

const referral = toReferral({ referralId: "r1", referrerId: "u1", referredUserId: "u2", referralCode: "ABC", referralType: "PASSENGER", status: "PENDING", referrerReward: 0, referredReward: 0, validatedAt: null, createdAt: "2026-11-01T00:00:00Z" });
const config = toConfig({ id: "c1", name: "Lancement", description: null, isActive: true, rewardMatrix: [{ referrerType: "PASSENGER", referredType: "PASSENGER", rewardMode: "PERCENTAGE", referrerAmount: 10, referredAmount: 5 }], validationConditions: { expirationDays: 30 }, activatedAt: null });

describe("parrainage (backend wami-co)", () => {
  it("convertit un parrainage et une configuration", () => {
    expect(referral).toMatchObject({ id: "r1", status: "pending", code: "ABC", refereeId: "u2" });
    expect(config).toMatchObject({ active: true, expirationDays: 30, rules: [{ mode: "percentage", referrerAmount: 10 }] });
  });
  it("seul un parrainage en attente se valide ou expire", () => {
    expect(validateBlocker(referral)).toBeNull();
    expect(validateBlocker({ ...referral, status: "validated" })).not.toBeNull();
  });
  it("une configuration active ne se supprime pas et ne se réactive pas", () => {
    expect(deleteBlocker(config)).not.toBeNull();
    expect(deleteBlocker({ ...config, active: false })).toBeNull();
    expect(activateBlocker(config)).not.toBeNull();
  });
});

describe("configuration de parrainage : brouillon", () => {
  it("brouillon par défaut valide une fois nommé, 25 combinaisons", async () => {
    const { defaultDraft, draftBlocker, fillMatrix } = await import("./config-draft");
    const d = defaultDraft();
    expect(d.rules).toHaveLength(25);
    expect(draftBlocker(d)).toMatch(/Nom/);
    expect(draftBlocker({ ...d, name: "Lancement" })).toBeNull();
    const filled = fillMatrix(d.rules, { ...d.rules[0]!, referrerAmount: 2000 });
    expect(filled.every((r) => r.referrerAmount === 2000)).toBe(true);
  });
  it("règles de la matrice, des limites et des conditions", async () => {
    const { defaultDraft, draftBlocker } = await import("./config-draft");
    const d = { ...defaultDraft(), name: "Test" };
    expect(draftBlocker({ ...d, rules: d.rules.slice(1) })).toMatch(/25/);
    expect(draftBlocker({ ...d, rules: d.rules.map((r, i) => (i === 0 ? { ...r, mode: "PERCENTAGE" as const, referrerAmount: 150 } : r)) })).toMatch(/pourcentage/);
    expect(draftBlocker({ ...d, limits: d.limits.map((l, i) => (i === 0 ? { ...l, maxPerDay: 99 } : l)) })).toMatch(/dépasse/);
    expect(draftBlocker({ ...d, conditions: d.conditions.map((c, i) => (i === 0 ? { ...c, actionsRequired: 0 } : c)) })).toMatch(/actions/);
    expect(draftBlocker({ ...d, expirationDays: 0 })).toMatch(/Expiration/);
  });
  it("aller-retour backend : le corps reprend la matrice et masque les plafonds en mode fixe", async () => {
    const { toConfig, toConfigBody } = await import("../application/referrals.http-repository");
    const { defaultDraft } = await import("./config-draft");
    const body = toConfigBody({ ...defaultDraft(), name: " Lancement " });
    expect(body).toMatchObject({ name: "Lancement", description: null });
    expect(body.rewardMatrix).toHaveLength(25);
    expect(body.rewardMatrix[0]).toMatchObject({ rewardMode: "FIXED", referrerCap: null });
    const back = toConfig({ id: "c", name: "x", description: null, isActive: false, rewardMatrix: body.rewardMatrix as never, limits: body.limits as never, validationConditions: body.validationConditions as never, activatedAt: null });
    expect(back.draft.rules).toHaveLength(25);
    expect(back.draft.limits).toHaveLength(5);
  });
});
