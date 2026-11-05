import { describe, expect, it } from "vitest";
import { toDelivery, type BackendB2c } from "../application/b2c-deliveries.http-repository";
import { cancelBlocker, matchesFilter, totals } from "./b2c-delivery";

const raw = (status: string, over: Partial<BackendB2c> = {}): BackendB2c => ({
  id: "d1", orderNumber: "DLV-1", status, vehicleType: "MOTO", paymentMethod: "WALLET",
  passenger: { name: "Nadège", phone: null }, driver: { name: "Aïcha", phone: "+229" },
  pickup: { address: "A" }, dropoff: { address: "B" }, parcel: { type: "DOCUMENT", description: "Contrat" }, recipient: { name: "Jean", phone: "+229 9" },
  pricing: { estimatedPrice: 2000, finalPrice: status === "COMPLETED" ? 2000 : null, platformCommission: status === "COMPLETED" ? 300 : null, driverPayout: null },
  pickupPhoto: null, deliveryPhoto: null, cancelReason: null, cancelledBy: null, scheduledAt: null, createdAt: "2026-11-05T00:00:00Z", ...over,
});

describe("livraisons B2C (backend wami-co)", () => {
  it("convertit une livraison", () => {
    expect(toDelivery(raw("IN_TRANSIT"))).toMatchObject({ number: "DLV-1", status: "transit", sender: "Nadège", driver: "Aïcha", parcel: "DOCUMENT · Contrat" });
    expect(toDelivery(raw("PENDING_MATCH", { driver: null })).driver).toBeNull();
  });
  it("filtres : en cours, à problème, recherche", () => {
    const transit = toDelivery(raw("IN_TRANSIT"));
    const failed = toDelivery(raw("DELIVERY_FAILED"));
    const done = toDelivery(raw("COMPLETED"));
    expect(matchesFilter(transit, { status: "active", q: "" })).toBe(true);
    expect(matchesFilter(done, { status: "active", q: "" })).toBe(false);
    expect(matchesFilter(failed, { status: "problem", q: "" })).toBe(true);
    expect(matchesFilter(transit, { status: "all", q: "aïcha" })).toBe(true);
    expect(matchesFilter(transit, { status: "all", q: "zzz" })).toBe(false);
  });
  it("annulation : pas si terminée ni si le colis est avec le livreur ; motif obligatoire", () => {
    expect(cancelBlocker(toDelivery(raw("COMPLETED")), "Erreur de saisie")).toMatch(/terminée/);
    expect(cancelBlocker(toDelivery(raw("IN_TRANSIT")), "Erreur de saisie")).toMatch(/livreur/);
    expect(cancelBlocker(toDelivery(raw("PENDING_MATCH")), "non")).toMatch(/Motif/);
    expect(cancelBlocker(toDelivery(raw("PENDING_MATCH")), "Demande du client")).toBeNull();
  });
  it("totaux : chiffre d'affaires des livrées seulement", () => {
    const rows = [toDelivery(raw("COMPLETED")), toDelivery(raw("DELIVERY_FAILED")), toDelivery(raw("IN_TRANSIT"))];
    expect(totals(rows)).toEqual({ count: 3, revenue: 2000, commission: 300, problems: 1 });
  });
});
