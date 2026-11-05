import { describe, expect, it } from "vitest";
import { toWelcomeBonus } from "../application/wallet-config.http-repository";
import { walletConfigBlocker, welcomeBonusBlocker, type WalletConfig } from "./wallet-config";

const cfg: WalletConfig = { consolidationEnabled: true, consolidationFeeRate: 0.01, consolidationMinAmount: 1000, p2pTransferEnabled: true, p2pTransferFeeRate: 0.01, p2pMinimumAmount: 500, withdrawalMinMobileMoney: 1000, withdrawalMinBankTransfer: 10000, grantMaxPerBeneficiary: 50000, grantMaxTotal: 5000000, grantMaxBeneficiaries: 2000 };

describe("règles des portefeuilles (backend wami-co)", () => {
  it("valide les frais et plafonds", () => {
    expect(walletConfigBlocker(cfg)).toBeNull();
    expect(walletConfigBlocker({ ...cfg, p2pTransferFeeRate: 0.9 })).toMatch(/frais/i);
    expect(walletConfigBlocker({ ...cfg, grantMaxTotal: 10 })).toMatch(/plafond total/i);
    expect(walletConfigBlocker({ ...cfg, p2pMinimumAmount: -1 })).toMatch(/entiers/);
  });
  it("bonus de bienvenue : jamais moins de places que consommées", () => {
    const b = toWelcomeBonus({ bonusAmountFcfa: 5000, maxEligibleDrivers: 500, consumedCount: 212, remainingSlots: 288, isActive: true });
    expect(b).toMatchObject({ amount: 5000, remaining: 288 });
    expect(welcomeBonusBlocker(b)).toBeNull();
    expect(welcomeBonusBlocker({ ...b, maxDrivers: 100 })).toMatch(/212/);
  });
});
