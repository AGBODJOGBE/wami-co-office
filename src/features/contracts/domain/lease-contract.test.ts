import { describe, expect, it } from "vitest";
import { arrears, health, paymentBlocker, remaining, type LeaseContract } from "./lease-contract";

const start = new Date("2026-08-03T08:00:00Z");
const weeksLater = (w: number) => new Date(start.getTime() + w * 7 * 86_400_000 + 3600_000);

const contract = (paid: number[]): LeaseContract => ({
  id: "c1",
  driverName: "X",
  vehicleLabel: "Moto",
  plate: "AB 0000",
  startDate: start.toISOString(),
  totalPrice: 600_000,
  deposit: 50_000,
  weeklyInstallment: 15_000,
  weeks: 40,
  payments: paid.map((amount, i) => ({ id: `p${i}`, date: start.toISOString(), amount, method: "momo" })),
  status: "active",
});

describe("location-vente", () => {
  it("à jour quand les versements suivent le calendrier", () => {
    const c = contract([15_000, 15_000, 15_000]);
    expect(arrears(c, weeksLater(3))).toBe(0);
    expect(health(c, weeksLater(3))).toBe("upToDate");
  });

  it("en retard puis critique à partir de trois échéances manquées", () => {
    const c = contract([15_000]);
    expect(health(c, weeksLater(3))).toBe("late");
    expect(health(c, weeksLater(4))).toBe("critical");
  });

  it("soldé quand le prix est payé", () => {
    const c = contract([600_000]);
    expect(remaining(c)).toBe(0);
    expect(health(c, weeksLater(10))).toBe("settled");
  });

  it("refuse un versement supérieur au reste à payer", () => {
    expect(paymentBlocker(contract([590_000]), 20_000)).not.toBeNull();
    expect(paymentBlocker(contract([590_000]), 10_000)).toBeNull();
  });
});
