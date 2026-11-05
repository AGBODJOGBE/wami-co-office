import { describe, expect, it } from "vitest";
import { toAffiliate, type BackendAffiliate } from "../application/affiliate.http-repository";
import { closeBlocker, rateBlocker, reactivateBlocker, suspendBlocker } from "./affiliate";

const backend: BackendAffiliate = {
  affiliateId: "a1",
  name: "Théophile K.",
  phoneNumber: "+229",
  socialNetwork: "Instagram",
  audienceSize: 12000,
  status: "ACTIVE",
  commissionRate: null,
  effectiveCommissionRate: 0.1,
  totalPayable: 50_000,
  totalPaid: 20_000,
  outstandingPayable: 30_000,
  codes: [{ code: "THEO", currentUsages: 9, isCurrentlyUsable: true }],
};

describe("affiliation (backend wami-co)", () => {
  it("convertit un profil", () => {
    expect(toAffiliate(backend)).toMatchObject({ id: "a1", status: "active", accrued: 50_000, outstanding: 30_000, codes: [{ code: "THEO", usages: 9, usable: true }] });
  });
  it("sanction : motif obligatoire ; pause : non", () => {
    const a = toAffiliate(backend);
    expect(suspendBlocker(a, "sanction", "")).toMatch(/Motif/);
    expect(suspendBlocker(a, "pause", "")).toBeNull();
  });
  it("réactivation seulement si suspendu ; clôture motivée", () => {
    const a = toAffiliate(backend);
    expect(reactivateBlocker(a)).not.toBeNull();
    expect(reactivateBlocker({ ...a, status: "suspended" })).toBeNull();
    expect(closeBlocker(a, "ok")).toMatch(/Motif/);
  });
  it("taux entre 0 et 1, ou vide", () => {
    expect(rateBlocker(null)).toBeNull();
    expect(rateBlocker(0.15)).toBeNull();
    expect(rateBlocker(1.5)).not.toBeNull();
  });
});
