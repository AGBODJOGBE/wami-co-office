import { describe, expect, it } from "vitest";
import { toRide, type BackendRide } from "../application/rides.http-repository";

const base: BackendRide = {
  rideId: "r1",
  rideNumber: "WMI-001",
  status: "IN_PROGRESS",
  vehicleType: "ECO",
  paymentMethod: "WALLET",
  passenger: { firstName: "Nadège", lastName: "A" },
  driver: { firstName: "Koffi", lastName: "H" },
  pickup: { address: "Cadjèhoun" },
  dropoff: { address: null },
  pricing: { estimatedPrice: 2000, finalPrice: null, waitingFee: 0, platformCommission: null },
  distance: { estimatedMeters: 4200, actualMeters: null },
  duration: { estimatedSeconds: 900, actualSeconds: null },
  cancelledBy: null,
  cancellationReason: null,
  createdAt: "2026-11-05T08:00:00Z",
};

describe("toRide (backend wami-co)", () => {
  it("course en cours : prix estimé, numéro lisible", () => {
    expect(toRide(base)).toMatchObject({ id: "r1", number: "WMI-001", status: "inProgress", category: "autoEco", payment: "wallet", price: 2000, distanceKm: 4.2, durationMin: 15, to: "—" });
  });
  it("terminée : prix final ; annulée par le système : annulée par l'admin", () => {
    expect(toRide({ ...base, status: "COMPLETED", pricing: { ...base.pricing, finalPrice: 2500 } })).toMatchObject({ status: "completed", price: 2500 });
    expect(toRide({ ...base, status: "CANCELLED_SYSTEM", cancelledBy: "SYSTEM", cancellationReason: "Doublon" })).toMatchObject({ status: "cancelled", cancelledBy: "admin", cancelReason: "Doublon" });
  });
  it("aucun chauffeur trouvé compte comme annulée", () => {
    expect(toRide({ ...base, status: "NO_DRIVER_FOUND", driver: null }).status).toBe("cancelled");
  });
});
