import { describe, expect, it } from "vitest";
import { toPartner } from "../application/partners.http-repository";
import { missingChecks, validateBlocker } from "./partner";

const full = toPartner({ id: "p1", companyName: "Chez Mama", companyType: "RESTAURANT", contactPhone: "+229 1", contactEmail: "m@x.bj", registrationNumber: "RB/1", createdAt: "x" });

describe("partenaires à valider (backend wami-co)", () => {
  it("convertit un partenaire", () => {
    expect(full).toMatchObject({ id: "p1", company: "Chez Mama", type: "RESTAURANT", phone: "+229 1" });
  });
  it("liste ce qui manque", () => {
    expect(missingChecks(full)).toEqual([]);
    expect(missingChecks({ ...full, registrationNumber: null, email: null })).toEqual(["numéro d'immatriculation", "e-mail"]);
  });
  it("validation : possible si complet ; sinon confirmation explicite", () => {
    expect(validateBlocker(full, false)).toBeNull();
    const incomplete = { ...full, registrationNumber: null };
    expect(validateBlocker(incomplete, false)).toMatch(/immatriculation/);
    expect(validateBlocker(incomplete, true)).toBeNull();
    expect(validateBlocker({ ...full, phone: " " }, true)).toMatch(/téléphone/);
  });
});
