import { describe, expect, it } from "vitest";
import { toDriver, type BackendDriver } from "../application/drivers.http-repository";
import { riskFlags } from "./driver";

const base: BackendDriver = {
  driverId: "d1",
  firstName: "Koffi",
  lastName: "A",
  phoneNumber: "+229",
  status: "AVAILABLE",
  driverType: "BOTH",
  rating: 4.7,
  totalRides: 10,
  vehicle: { make: "Toyota", model: "Yaris", color: "b", licensePlate: "AB1" },
  createdAt: "2026-01-01T00:00:00Z",
};

describe("toDriver (backend wami-co)", () => {
  it("convertit un chauffeur disponible", () => {
    const d = toDriver(base);
    expect(d).toMatchObject({ id: "d1", name: "Koffi A", status: "active", online: true, activities: ["driver", "courier"], vehicle: "Toyota Yaris · AB1" });
  });
  it("SUSPENDED devient suspendu et hors ligne", () => {
    expect(toDriver({ ...base, status: "SUSPENDED" })).toMatchObject({ status: "suspended", online: false });
  });
  it("sans véhicule, et sans signaux inconnus", () => {
    const d = toDriver({ ...base, vehicle: null, driverType: "DELIVERY" });
    expect(d.vehicle).toBe("Aucun véhicule");
    expect(d.activities).toEqual(["courier"]);
    expect(riskFlags(d)).toEqual([]);
  });
});
