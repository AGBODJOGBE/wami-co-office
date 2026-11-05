import { describe, expect, it } from "vitest";
import { toMatching, toSettlement, toTelemetry, toTrack } from "../application/ride-detail.http-repository";
import { flatten, unavailableLabel } from "./ride-detail";

describe("détail d'une course (backend wami-co)", () => {
  it("aplatit un objet imbriqué avec libellés lisibles", () => {
    const rows = flatten({ distances: { actualMeters: 4200 }, signal: { ok: true, gaps: [] }, outcome: "COMPLETED", tags: ["a", "b"] });
    expect(rows).toEqual([
      { key: "Distances › actualMeters", value: "4200" },
      { key: "Qualité du signal GPS › ok", value: "oui" },
      { key: "Qualité du signal GPS › gaps", value: "—" },
      { key: "Issue", value: "COMPLETED" },
      { key: "tags", value: "a, b" },
    ]);
  });
  it("télémétrie indisponible : on garde la raison", () => {
    expect(toTelemetry({ available: false, reason: "RIDE_NOT_TERMINAL_YET" })).toEqual({ available: false, reason: "RIDE_NOT_TERMINAL_YET" });
    expect(unavailableLabel("RIDE_NOT_TERMINAL_YET")).toMatch(/pas encore terminée/);
    expect(unavailableLabel("INCONNUE")).toBe("INCONNUE");
  });
  it("matching : cycles et rayons", () => {
    const m = toMatching({ available: true, summary: { solicitedCount: 3, ignoredCount: 1, cycles: [{ at: "t", trigger: "INITIAL", vehicleType: "MOTO", outcome: "SOLICITED", steps: [{ radiusKm: 2, eligible: 4 }, { radiusKm: 4, eligible: 6 }] }], milestones: [{ at: "t2", code: "SURGE_ACTIVATED" }] } });
    expect(m).toMatchObject({ available: true, cycles: [{ radii: "2 km (4) → 4 km (6)" }], milestones: [{ code: "SURGE_ACTIVATED", detail: null }] });
  });
  it("trace GPS : segments ou indisponibilité", () => {
    expect(toTrack({ trackAvailable: false, reason: "PURGED_TTL" })).toEqual({ available: false, reason: "PURGED_TTL" });
    expect(toTrack({ trackAvailable: true, pointCount: 100, decimatedPointCount: 10, geojson: { features: [{ properties: { rideStatus: "IN_PROGRESS", startTimestamp: "a", endTimestamp: "b", pointCount: 100 } }] } })).toMatchObject({ available: true, sampledCount: 10, segments: [{ points: 100 }] });
  });
  it("règlement de garantie", () => {
    const s = toSettlement({ rideNumber: "W1", status: "COMPLETED", guarantee: { amount: 1050, ratePct: 30, holdStatus: "RELEASED", heldAt: "h", resolvedAt: null }, movements: [{ transactionId: "t", type: "GUARANTEE_RELEASE", direction: "CREDIT", amount: 1050, description: "Libération", createdAt: "c", isMarker: false }] });
    expect(s.facts[0]).toEqual({ key: "Garantie gelée", value: expect.stringContaining("(30 %)") });
    expect(s.movements[0]).toMatchObject({ amount: 1050, isMarker: false });
  });
});
