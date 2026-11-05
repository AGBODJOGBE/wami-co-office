import { describe, expect, it } from "vitest";
import { toSkip, toStatement, type BackendStatement } from "../application/affiliate-ops.http-repository";
import { cancelCommissionBlocker, configBlocker, holdBlocker, newAffiliateBlocker, releaseBlocker, type NewAffiliate } from "./affiliate-ops";

const raw: BackendStatement = {
  suspensionReason: null,
  statement: {
    byStatus: [{ status: "ACCRUED", count: 1, totalAmount: 2000 }],
    totals: { totalAccrued: 2000, totalPaid: 0, outstandingPayable: 2000, heldOutstanding: 0 },
    walletBalance: { affiliateBalance: 2000 },
    lines: [{ commissionId: "c1", sourceType: "RIDE", amount: 2000, payableAmount: 2000, paidAmount: 0, outstandingPayableAmount: 2000, appliedRate: 0.1, status: "ACCRUED", accruedAt: "2026-11-05T00:00:00Z", held: false }],
  },
};
const st = toStatement(raw);
const line = st.lines[0]!;

describe("affiliation : relevé, configuration, création (backend wami-co)", () => {
  it("convertit le relevé et une commission ignorée", () => {
    expect(st).toMatchObject({ totalAccrued: 2000, outstanding: 2000, walletBalance: 2000 });
    expect(line).toMatchObject({ id: "c1", outstanding: 2000, held: false });
    expect(toSkip({ skipId: "s", affiliateId: "a", reason: "ZERO_RATE", sourceType: "RIDE", platformCommission: 100, potentialAmount: null, appliedAt: "x", resolvedAt: "y" })).toMatchObject({ resolved: true, potential: null });
  });
  it("retenue, libération, annulation : motif et état", () => {
    expect(holdBlocker(line, "ok")).toMatch(/Motif/);
    expect(holdBlocker(line, "Fraude suspectée")).toBeNull();
    expect(holdBlocker({ ...line, held: true }, "Fraude suspectée")).toMatch(/déjà retenue/);
    expect(releaseBlocker(line)).not.toBeNull();
    expect(releaseBlocker({ ...line, held: true })).toBeNull();
    expect(cancelCommissionBlocker({ ...line, status: "PAID" }, "Doublon constaté")).toMatch(/réglée/);
    expect(cancelCommissionBlocker(line, "Doublon constaté")).toBeNull();
  });
  it("configuration : taux et minimum", () => {
    expect(configBlocker({ defaultCommissionRate: 0.1, minPayoutAmount: 5000 })).toBeNull();
    expect(configBlocker({ defaultCommissionRate: 1.5, minPayoutAmount: 5000 })).toMatch(/taux/);
    expect(configBlocker({ defaultCommissionRate: 0.1, minPayoutAmount: -1 })).toMatch(/minimum/i);
  });
  it("création : numéro vérifié et éligible, champs obligatoires", () => {
    const a: NewAffiliate = { phoneNumber: "+229 97 00 00 01", name: "Théo", socialNetwork: "Instagram", audienceSize: null, commissionRate: null };
    expect(newAffiliateBlocker(a, null)).toMatch(/éligibilité/);
    expect(newAffiliateBlocker(a, { status: "alreadyAffiliate", displayName: null })).toMatch(/déjà affiliée/);
    expect(newAffiliateBlocker(a, { status: "eligible", displayName: "Théo" })).toBeNull();
    expect(newAffiliateBlocker({ ...a, socialNetwork: "" }, { status: "eligible", displayName: null })).toMatch(/Réseau/);
    expect(newAffiliateBlocker({ ...a, commissionRate: 2 }, { status: "eligible", displayName: null })).toMatch(/taux/);
  });
});
