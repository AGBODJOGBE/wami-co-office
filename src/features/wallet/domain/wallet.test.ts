import { describe, expect, it } from "vitest";
import { toMovement, toWallet, type BackendWallet } from "../application/wallet.http-repository";
import { blockBlocker, unblockBlocker } from "./wallet";

const bw: BackendWallet = { walletId: "w1", walletType: "EARNINGS", totalBalance: 1000, status: "ACTIVE", withdrawalsBlocked: false, withdrawalsBlockedReason: null, ownerName: "Koffi", ownerPhone: "+229" };

describe("wallet (backend wami-co)", () => {
  it("convertit le type de portefeuille et le statut", () => {
    expect(toWallet(bw)).toMatchObject({ id: "w1", ownerType: "partner", status: "active", balance: 1000 });
    expect(toWallet({ ...bw, walletType: "PAYMENT", status: "SUSPENDED" })).toMatchObject({ ownerType: "client", status: "frozen" });
  });
  it("un débit devient un montant négatif", () => {
    expect(toMovement({ transactionId: "t", direction: "DEBIT", amount: 500, description: "Course", createdAt: "x" }).amount).toBe(-500);
  });
  it("blocage : motif obligatoire, pas de double blocage", () => {
    const w = toWallet(bw);
    expect(blockBlocker(w, "court")).toMatch(/Motif/);
    expect(blockBlocker(w, "Fraude suspectée")).toBeNull();
    expect(blockBlocker({ ...w, withdrawalsBlocked: true }, "Fraude suspectée")).toMatch(/déjà/);
    expect(unblockBlocker(w)).toMatch(/pas bloqués/);
  });
});
