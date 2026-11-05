import { describe, expect, it } from "vitest";
import { toList, type BackendManualAssignment } from "../application/scheduled-rides.http-repository";
import { assignBlocker, kmLabel, rankCandidates, urgency } from "./scheduled-ride";

const cand = (id: string, online: boolean, distanceMeters: number | null, rating = 4.5) => ({ driverId: id, firstName: id, lastName: "X", phoneNumber: "+229", rating, totalRides: 10, vehicle: { make: "Toyota", model: "Yaris", licensePlate: "AB1" }, isOnline: online, distanceMeters });
const raw: BackendManualAssignment = {
  thresholdMinutes: 45,
  rides: [{ rideId: "r1", rideNumber: "WMI-1", scheduledAt: "2026-11-05T10:00:00Z", minutesUntilDeparture: 12, vehicleType: "ECO", pickup: { address: "A" }, dropoff: { address: null }, estimatedPrice: 3000, guaranteeAmount: null, candidates: [cand("far", true, 5000), cand("off", false, 100), cand("near", true, 800), cand("unk", true, null)] }],
};

describe("courses programmées (backend wami-co)", () => {
  const { rides, thresholdMinutes } = toList(raw);
  const r = rides[0]!;
  it("convertit la liste", () => {
    expect(thresholdMinutes).toBe(45);
    expect(r).toMatchObject({ id: "r1", number: "WMI-1", minutesLeft: 12, to: "—", price: 3000 });
  });
  it("classe les candidats : en ligne, puis le plus proche, position inconnue en dernier", () => {
    expect(rankCandidates(r.candidates).map((c) => c.driverId)).toEqual(["near", "far", "unk", "off"]);
  });
  it("urgence selon les minutes restantes", () => {
    expect(urgency(r, 45)).toBe("critical");
    expect(urgency({ ...r, minutesLeft: 30 }, 45)).toBe("soon");
    expect(urgency({ ...r, minutesLeft: 90 }, 45)).toBe("ok");
  });
  it("affectation : seulement un candidat proposé, avant le départ", () => {
    expect(assignBlocker(r, r.candidates[0]!)).toBeNull();
    expect(assignBlocker(r, { ...r.candidates[0]!, driverId: "inconnu" })).not.toBeNull();
    expect(assignBlocker({ ...r, minutesLeft: -3 }, r.candidates[0]!)).toMatch(/passé/);
  });
  it("libellé de distance", () => {
    expect(kmLabel(800)).toBe("800 m");
    expect(kmLabel(1500)).toBe("1,5 km");
    expect(kmLabel(null)).toBe("position inconnue");
  });
});
