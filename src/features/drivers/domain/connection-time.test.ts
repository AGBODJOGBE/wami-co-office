import { describe, expect, it } from "vitest";
import { toReport } from "../application/connection-time.use-cases";
import { avgHoursPerDay, periodBlocker, ranked } from "./connection-time";

describe("temps de connexion (backend wami-co)", () => {
  const r = toReport({ from: "2026-11-01", to: "2026-11-02", drivers: [
    { driverId: "a", days: [{ date: "2026-11-01", totalSeconds: 3600 }], grandTotalSeconds: 3600 },
    { driverId: "b", days: [{ date: "2026-11-01", totalSeconds: 7200 }, { date: "2026-11-02", totalSeconds: 3600 }], grandTotalSeconds: 10800 },
  ] });
  it("convertit et classe par temps total", () => {
    expect(ranked(r.drivers).map((d) => d.driverId)).toEqual(["b", "a"]);
    expect(r.drivers[1]!.days[0]).toEqual({ date: "2026-11-01", seconds: 7200 });
  });
  it("moyenne par jour connecté", () => {
    expect(avgHoursPerDay(r.drivers[1]!)).toBe(1.5);
    expect(avgHoursPerDay({ driverId: "x", days: [], totalSeconds: 0 })).toBe(0);
  });
  it("période : dates, ordre, 92 jours maximum", () => {
    expect(periodBlocker("2026-11-01", "2026-11-05")).toBeNull();
    expect(periodBlocker("", "2026-11-05")).toMatch(/deux dates/);
    expect(periodBlocker("2026-11-05", "2026-11-01")).toMatch(/précède/);
    expect(periodBlocker("2026-01-01", "2026-11-01")).toMatch(/92 jours/);
  });
});
