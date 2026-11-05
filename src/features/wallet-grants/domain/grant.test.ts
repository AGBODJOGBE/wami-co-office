import { describe, expect, it } from "vitest";
import { toGrant, toPreview, type BackendGrant } from "../application/grants.http-repository";
import { approveBlocker, cancelBlocker, draftBlocker, parseIds, rejectBlocker, retryBlocker } from "./grant";

const raw: BackendGrant = { campaignId: "g1", audience: "DRIVER", label: "Tabaski", balanceType: "BONUS", amountPerBeneficiary: 2000, beneficiaryCount: 10, totalAmount: 20000, status: "PENDING_APPROVAL", createdBy: "u1", createdAt: "2026-11-05T00:00:00Z", approvedBy: null, creditedCount: 0, failedCount: 0 };
const g = toGrant(raw);

describe("dotations (backend wami-co)", () => {
  it("convertit une dotation et un aperçu", () => {
    expect(g).toMatchObject({ id: "g1", status: "pending", total: 20000, amountEach: 2000 });
    expect(toPreview({ beneficiaryCount: 2, totalAmount: 4000, unknownIds: ["x"], beneficiariesInOverdraft: 1, amountAbsorbedByDebt: 500, capViolations: [{ cap: "maxTotal", limit: 100, actual: 200 }], notes: [] })).toMatchObject({ beneficiaries: 2, inOverdraft: 1, violations: ["maxTotal : 200 > 100"] });
  });
  it("brouillon : libellé, montant, bénéficiaires, doublons", () => {
    const d = { label: "Tabaski", audience: "DRIVER" as const, balance: "BONUS" as const, amountEach: 2000, beneficiaryIds: ["a", "b"] };
    expect(draftBlocker(d)).toBeNull();
    expect(draftBlocker({ ...d, amountEach: 0 })).toMatch(/Montant/);
    expect(draftBlocker({ ...d, beneficiaryIds: [] })).toMatch(/bénéficiaire/);
    expect(draftBlocker({ ...d, beneficiaryIds: ["a", "a"] })).toMatch(/deux fois/);
    expect(parseIds("a, b\nc ;d")).toEqual(["a", "b", "c", "d"]);
  });
  it("quatre yeux : pas d'approbation de sa propre demande", () => {
    expect(approveBlocker(g, "u1")).toMatch(/propre/);
    expect(approveBlocker(g, "u2")).toBeNull();
    expect(rejectBlocker(g, "ok", "u2")).toMatch(/Motif/);
    expect(rejectBlocker(g, "Doublon", "u2")).toBeNull();
  });
  it("annulation et relance selon le statut", () => {
    expect(cancelBlocker(g)).toBeNull();
    expect(cancelBlocker({ ...g, status: "completed" })).not.toBeNull();
    expect(retryBlocker(g)).not.toBeNull();
    expect(retryBlocker({ ...g, status: "partiallyFailed" })).toBeNull();
  });
});
