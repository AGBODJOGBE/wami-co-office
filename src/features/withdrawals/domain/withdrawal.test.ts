import { describe, expect, it } from "vitest";
import { recipientOf, toWithdrawal, type BackendWithdrawal } from "../application/withdrawals.http-repository";
import { approveBlocker, rejectBlocker } from "./withdrawal";

const raw: BackendWithdrawal = { withdrawalId: "w1", walletId: "x", ownerName: "Koffi", ownerPhone: "+229", amount: 25_000, method: "MOBILE_MONEY", recipientDetails: { phone: "+229 01" }, status: "AWAITING_APPROVAL", reference: null, failureReason: null, rejectionReason: null, sourceBalance: "AFFILIATE", affiliateSummary: { outstandingPayable: 5000 }, createdAt: "2026-11-05T00:00:00Z" };

describe("retraits (backend wami-co)", () => {
  it("convertit un retrait", () => {
    expect(toWithdrawal(raw)).toMatchObject({ id: "w1", status: "awaiting", recipient: "+229 01", source: "AFFILIATE", affiliateOutstanding: 5000 });
    expect(toWithdrawal({ ...raw, status: "REJECTED" }).status).toBe("rejected");
  });
  it("destinataire bancaire", () => {
    expect(recipientOf({ bankName: "BOA", iban: "BJ00" })).toBe("BOA · BJ00");
    expect(recipientOf({})).toBe("—");
  });
  it("approuver ou rejeter seulement un retrait à valider, rejet motivé", () => {
    const w = toWithdrawal(raw);
    expect(approveBlocker(w)).toBeNull();
    expect(rejectBlocker(w, "non")).toMatch(/Motif/);
    expect(rejectBlocker(w, "Compte suspect")).toBeNull();
    expect(approveBlocker({ ...w, status: "completed" })).not.toBeNull();
  });
});
