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
