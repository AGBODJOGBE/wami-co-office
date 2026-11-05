import { describe, expect, it } from "vitest";
import { toContract, type BackendContract } from "../application/contracts.http-repository";
import { arrears, health, paymentBlocker, remaining, transitionBlocker, type LeaseContract } from "./lease-contract";

const backend: BackendContract = {
  id: "c1",
  driverId: "d1",
  dateDebut: "2026-08-03T08:00:00Z",
  dateFinPrevue: "2027-05-03T08:00:00Z",
  frequenceEcheances: "HEBDOMADAIRE",
  nbEcheances: 40,
  montantTotal: 600_000,
  downPayment: 50_000,
  montantEcheance: 15_000,
  montantPaye: 45_000,
  montantRestant: 555_000,
  statut: "ACTIF",
  nbImpayes: 0,
  modeRemboursement: "ECHEANCIER",
  vehicle: { licensePlate: "AB 0000", make: "Bajaj", model: "Boxer" },
};
const contract = (over: Partial<BackendContract> = {}): LeaseContract => toContract({ ...backend, ...over }, new Map([["d1", "Koffi A."]]));

describe("location-vente (backend wami-co)", () => {
  it("convertit le contrat du backend", () => {
    expect(contract()).toMatchObject({ driverName: "Koffi A.", plate: "AB 0000", frequency: "weekly", status: "active", installmentAmount: 15_000, vehicleLabel: "Bajaj Boxer" });
    expect(contract({ statut: "ROMPU", modeRemboursement: "PAR_REVENU" })).toMatchObject({ status: "broken", repaymentMode: "revenueShare" });
  });
  it("à jour, en retard puis critique à trois échéances impayées", () => {
    expect(health(contract())).toBe("upToDate");
    expect(health(contract({ nbImpayes: 2 }))).toBe("late");
    expect(health(contract({ nbImpayes: 3 }))).toBe("critical");
    expect(arrears(contract({ nbImpayes: 2 }))).toBe(30_000);
  });
  it("soldé quand il ne reste rien", () => {
    const c = contract({ montantRestant: 0, montantPaye: 600_000 });
    expect(remaining(c)).toBe(0);
    expect(health(c)).toBe("settled");
  });
  it("refuse un versement trop grand, nul ou sans référence", () => {
    const c = contract({ montantRestant: 10_000 });
    expect(paymentBlocker(c, 20_000, "R1")).not.toBeNull();
    expect(paymentBlocker(c, 10_000, " ")).toMatch(/Référence/);
    expect(paymentBlocker(c, 10_000, "R1")).toBeNull();
  });
  it("transitions : reprise seulement si suspendu, rupture motivée", () => {
    expect(transitionBlocker(contract(), "resume", "")).not.toBeNull();
    expect(transitionBlocker(contract({ statut: "SUSPENDU" }), "resume", "")).toBeNull();
    expect(transitionBlocker(contract(), "break", "court")).toMatch(/Motif/);
    expect(transitionBlocker(contract(), "break", "Véhicule non restitué")).toBeNull();
  });
});
