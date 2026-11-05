import { describe, expect, it } from "vitest";
import { toBody, toPlan, type BackendPlan } from "../application/plans.http-repository";
import { deactivateBlocker, emptyPlan, fromCentimes, planBlocker, pricePerDelivery, reactivateBlocker, toCentimes } from "./plan";

const raw: BackendPlan = { planId: "p1", name: "Starter", description: null, durationInDays: 30, deliveryQuota: 100, onQuotaExhausted: "BLOCK_NEW_ORDERS", price: 15_000_000, isActive: true };

describe("plans d'abonnement (backend wami-co, prix en centimes)", () => {
  it("convertit centimes ↔ FCFA", () => {
    expect(fromCentimes(15_000_000)).toBe(150_000);
    expect(toCentimes(150_000)).toBe(15_000_000);
    expect(toPlan(raw)).toMatchObject({ id: "p1", price: 150_000, quota: 100, active: true });
  });
  it("le corps envoyé au backend est en centimes", () => {
    expect(toBody({ ...emptyPlan(), name: " Pro ", price: 45_000, quota: null })).toMatchObject({ name: "Pro", price: 4_500_000, deliveryQuota: null, durationInDays: 30 });
  });
  it("règles du plan : nom, doublon, durée, quota, prix", () => {
    const existing = [toPlan(raw)];
    const ok = { ...emptyPlan(), name: "Pro", price: 1000 };
    expect(planBlocker(ok, existing)).toBeNull();
    expect(planBlocker({ ...ok, name: "starter" }, existing)).toMatch(/déjà/);
    expect(planBlocker({ ...ok, name: "starter" }, existing, "p1")).toBeNull();
    expect(planBlocker({ ...ok, durationDays: 0 }, existing)).toMatch(/Durée/);
    expect(planBlocker({ ...ok, quota: 0 }, existing)).toMatch(/Quota/);
    expect(planBlocker({ ...ok, price: -5 }, existing)).toMatch(/Prix/);
  });
  it("activation et prix par livraison", () => {
    const p = toPlan(raw);
    expect(deactivateBlocker(p)).toBeNull();
    expect(reactivateBlocker(p)).not.toBeNull();
    expect(pricePerDelivery(p)).toBe(1500);
    expect(pricePerDelivery({ ...p, quota: null })).toBeNull();
  });
});
