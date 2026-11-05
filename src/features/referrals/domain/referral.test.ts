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
