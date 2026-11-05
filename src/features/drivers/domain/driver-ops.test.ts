import { describe, expect, it } from "vitest";
import { toOnline } from "../application/driver-ops.http-repository";
import { approveBlocker, hoursLabel, typeBlocker } from "./driver-ops";

describe("opérations chauffeurs (backend wami-co)", () => {
  it("convertit un chauffeur en ligne", () => {
    expect(toOnline({ driverId: "d1", firstName: "Koffi", lastName: "A", phoneNumber: "+229", rating: 4.8, totalRides: 10, latitude: 6.37, longitude: 2.39, vehicle: { make: "Bajaj", model: "Boxer", licensePlate: "AB1" }, isInRide: true, updatedAt: "x" })).toMatchObject({ name: "Koffi A", vehicle: "Bajaj Boxer · AB1", inRide: true });
    expect(toOnline({ driverId: "d2", firstName: "B", lastName: "", phoneNumber: "", rating: 5, totalRides: 0, latitude: 0, longitude: 0, vehicle: null, isInRide: false, updatedAt: "x" }).vehicle).toBe("—");
  });
  it("approbation : documents vérifiés", () => {
    expect(approveBlocker({ id: "1", userId: "u", documentsVerified: true, createdAt: "x" })).toBeNull();
    expect(approveBlocker({ id: "1", userId: "u", documentsVerified: false, createdAt: "x" })).toMatch(/documents/i);
  });
  it("changement de type : refuse un type identique", () => {
    expect(typeBlocker("VTC", "VTC")).not.toBeNull();
    expect(typeBlocker("VTC", "BOTH")).toBeNull();
  });
  it("durées", () => {
    expect(hoursLabel(10_000)).toBe("2 h 46");
    expect(hoursLabel(1_800)).toBe("30 min");
  });
});

describe("modification des informations d'un chauffeur", () => {
  it("n'envoie que les champs modifiés", async () => {
    const { infoBody, infoFrom } = await import("./driver-ops");
    const original = infoFrom("Koffi Mensah", "+229 97 00 00 01");
    const d = { ...original, lastName: "Agbodjo", email: "k@x.bj", city: "Cotonou", quarter: "Akpakpa" };
    expect(infoBody(d, original)).toEqual({ firstName: undefined, lastName: "Agbodjo", phoneNumber: undefined, email: "k@x.bj", gender: undefined, address: { city: "Cotonou", quarter: "Akpakpa" } });
  });
  it("refuse sans changement, téléphone ou e-mail invalides, adresse incomplète", async () => {
    const { infoBlocker, infoFrom } = await import("./driver-ops");
    const o = infoFrom("Koffi Mensah", "+229 97 00 00 01");
    expect(infoBlocker(o, o)).toMatch(/Aucune/);
    expect(infoBlocker({ ...o, phoneNumber: "12" }, o)).toMatch(/téléphone/);
    expect(infoBlocker({ ...o, email: "pas-un-mail" }, o)).toMatch(/e-mail/);
    expect(infoBlocker({ ...o, city: "Cotonou" }, o)).toMatch(/quartier/);
    expect(infoBlocker({ ...o, lastName: "Agbodjo" }, o)).toBeNull();
  });
});
