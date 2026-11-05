import { describe, expect, it } from "vitest";
import { toPayment, type BackendPayment } from "../application/payments.http-repository";
import { statusOf, totals } from "./payment";

const raw = (status: string, amount: number): BackendPayment => ({ paymentIntentId: status + amount, walletId: "w", ownerName: "", ownerPhone: "+229 1", operationType: "RECHARGE", status, provider: "FEDAPAY", amount, phone: null, failureReason: null, createdAt: "2026-11-05T00:00:00Z" });

describe("paiements (backend wami-co)", () => {
  it("normalise le statut libre du backend", () => {
    expect(statusOf("approved")).toBe("success");
    expect(statusOf("DECLINED")).toBe("failed");
    expect(statusOf("processing")).toBe("pending");
    expect(statusOf("???")).toBe("other");
  });
  it("convertit un paiement (téléphone de repli)", () => {
    expect(toPayment(raw("SUCCESS", 5000))).toMatchObject({ ownerName: "—", phone: "+229 1", status: "success" });
  });
  it("totaux : encaissé = réussis seulement, taux d'échec", () => {
    const t = totals([toPayment(raw("SUCCESS", 5000)), toPayment(raw("FAILED", 20000)), toPayment(raw("PENDING", 1000)), toPayment(raw("SUCCESS", 3000))]);
    expect(t).toMatchObject({ count: 4, amount: 8000, failureRate: 0.25 });
    expect(totals([]).failureRate).toBe(0);
  });
});
