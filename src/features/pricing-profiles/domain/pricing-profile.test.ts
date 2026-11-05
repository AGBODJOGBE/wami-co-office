import { describe, expect, it } from "vitest";
import { summarize, toDetail, toSummary, toZone, type BackendProfile } from "../application/pricing-profiles.http-repository";
import { activateBlocker, deactivateBlocker, deleteBlocker, shareBlocker, zoneBlocker, type PricingZone } from "./pricing-profile";

const raw: BackendProfile = { profileId: "p1", serviceKey: "RIDE", vehicleType: "MOTO", name: "Course moto", strategy: "PER_KM", isActive: true, version: 3, updatedAt: "2026-11-05T00:00:00Z", commissionRate: 0.15, driverShareRate: 0.85, components: [{ type: "PER_KM_TIER", label: "Prix au km", tiers: [{}, {}] }, { type: "WAITING_FEE", label: "Attente", value: 25 }] };

describe("profils tarifaires (backend wami-co)", () => {
  it("convertit un profil et résume ses composantes", () => {
    expect(toSummary(raw)).toMatchObject({ id: "p1", active: true, version: 3 });
    expect(toDetail(raw).components).toEqual([{ type: "PER_KM_TIER", label: "Prix au km", summary: "2 paliers" }, { type: "WAITING_FEE", label: "Attente", summary: "25" }]);
    expect(summarize({ type: "X", label: "x" })).toBe("—");
  });
  it("activation, désactivation, suppression selon l'état", () => {
    const p = toSummary(raw);
    expect(activateBlocker(p)).not.toBeNull();
    expect(deactivateBlocker(p)).toBeNull();
    expect(deleteBlocker(p)).not.toBeNull();
    expect(deleteBlocker({ ...p, active: false })).toBeNull();
  });
  it("commission + part chauffeur = 100 %", () => {
    expect(shareBlocker(toDetail(raw))).toBeNull();
    expect(shareBlocker({ ...toDetail(raw), driverShareRate: 0.9 })).toMatch(/100 %/);
  });
  it("zone : code valide, nom, doublon", () => {
    const existing: PricingZone[] = [toZone({ zoneId: "z1", serviceKey: "RIDE", code: "COTONOU", name: "Cotonou", type: "CITY", isActive: true })];
    expect(zoneBlocker({ service: "RIDE", code: "calavi", name: "Calavi", type: "CITY" }, existing)).toBeNull();
    expect(zoneBlocker({ service: "RIDE", code: "x", name: "Calavi", type: "CITY" }, existing)).toMatch(/Code/);
    expect(zoneBlocker({ service: "RIDE", code: "cotonou", name: "Cotonou", type: "CITY" }, existing)).toMatch(/existe déjà/);
    expect(zoneBlocker({ service: "RIDE", code: "COTONOU", name: "A", type: "CITY" }, existing)).toMatch(/Nom/);
  });
});
