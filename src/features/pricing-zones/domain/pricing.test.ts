import { describe, expect, it } from "vitest";
import { estimateFare, tariffBlocker, type Tariff } from "./pricing";

const moto: Tariff = {
  service: "moto",
  label: "Moto",
  base: 300,
  perKm: 150,
  perMin: 15,
  minimum: 500,
  freeWaitMin: 2,
  waitPerMin: 50,
  pausePerMin: 25,
  updatedAt: "",
  updatedBy: "",
};

describe("tarifs", () => {
  it("prix = prise en charge + km + minutes, arrondi à 50 F", () => {
    expect(estimateFare(moto, 5, 12)).toBe(1250); // 300 + 750 + 180 = 1230 → 1250
  });

  it("jamais sous le minimum", () => {
    expect(estimateFare(moto, 0.5, 2)).toBe(500);
  });

  it("refuse un minimum inférieur à la prise en charge", () => {
    expect(tariffBlocker({ ...moto, minimum: 200 })).not.toBeNull();
    expect(tariffBlocker(moto)).toBeNull();
  });
});
