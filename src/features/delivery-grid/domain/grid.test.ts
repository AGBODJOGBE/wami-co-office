import { describe, expect, it } from "vitest";
import { toBody, toGrid, type BackendGrid } from "../application/grid.http-repository";
import { changes, draftFrom, gridBlocker } from "./grid";

const raw: BackendGrid = {
  id: "g1", version: "2026-10", isActive: true,
  baseFees: { COURRIER: 1000, PETIT_COLIS: 1500, COLIS_MOYEN: 2500, COLIS_VOLUMINEUX: 4000, FRAGILE: 3000, HAUTE_VALEUR: 5000, PERISSABLE: 3500 },
  sensitivitySurcharges: { FRAGILE: 500 },
  zonePricingMatrix: [{ originZoneCode: "COTONOU", destinationZoneCode: "CALAVI", fee: 1500 }],
  distanceRanges: [{ minKm: 0, maxKm: 5, fee: 0 }, { minKm: 5, maxKm: null, fee: 200 }],
  weightSurchargePerKg: 100, urgencyMultipliers: { EXPRESS: 1.5, SAME_DAY: 1.25 }, insuranceRate: 0.02, insuranceMinimum: 500, codFeeRate: 0.03, codFeeMinimum: 300, activatedAt: null,
};
const active = toGrid(raw);
const draft = (over = {}) => ({ ...draftFrom(active), version: "2026-11", ...over });

describe("grille tarifaire des livraisons (backend wami-co)", () => {
  it("convertit la grille et reconstruit le corps de requête", () => {
    expect(active).toMatchObject({ version: "2026-10", fragileSurcharge: 500, expressMultiplier: 1.5 });
    const body = toBody(draft({ zones: [{ origin: " cotonou ", destination: "calavi", fee: 1500 }] }));
    expect(body).toMatchObject({ version: "2026-11", sensitivitySurcharges: { FRAGILE: 500 }, urgencyMultipliers: { EXPRESS: 1.5, SAME_DAY: 1.25 } });
    expect(body.zonePricingMatrix).toEqual([{ originZoneCode: "COTONOU", destinationZoneCode: "CALAVI", fee: 1500 }]);
  });
  it("un brouillon copié de la grille active est valide une fois nommé", () => {
    expect(gridBlocker(draftFrom(active), [])).toMatch(/Version/);
    expect(gridBlocker(draft(), ["2026-10"])).toBeNull();
    expect(gridBlocker(draft({ version: "2026-10" }), ["2026-10"])).toMatch(/existe déjà/);
  });
  it("règles : tarifs, zones en double, tranches, coefficients, taux", () => {
    expect(gridBlocker(draft({ baseFees: { ...active.baseFees, COURRIER: -1 } }), [])).toMatch(/tarif de base/);
    expect(gridBlocker(draft({ zones: [] }), [])).toMatch(/zone/);
    expect(gridBlocker(draft({ zones: [{ origin: "A", destination: "B", fee: 1 }, { origin: "a", destination: "b", fee: 2 }] }), [])).toMatch(/même origine/);
    expect(gridBlocker(draft({ distanceRanges: [{ minKm: 0, maxKm: 5, fee: 0 }, { minKm: 3, maxKm: null, fee: 1 }] }), [])).toMatch(/chevauchent/);
    expect(gridBlocker(draft({ distanceRanges: [{ minKm: 5, maxKm: 2, fee: 0 }] }), [])).toMatch(/fin doit dépasser/);
    expect(gridBlocker(draft({ expressMultiplier: 0.9 }), [])).toMatch(/au moins 1/);
    expect(gridBlocker(draft({ insuranceRate: 1.5 }), [])).toMatch(/0 % et 100 %/);
  });
  it("liste les écarts avec la grille active", () => {
    expect(changes(active, draft())).toEqual([]);
    expect(changes(active, draft({ baseFees: { ...active.baseFees, COURRIER: 1200 }, expressMultiplier: 2 }))).toEqual(["Courrier : 1000 → 1200 F", "Express : ×1.5 → ×2"]);
  });
});
