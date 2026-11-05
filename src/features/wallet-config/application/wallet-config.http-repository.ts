import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { WalletConfig, WelcomeBonus } from "../domain/wallet-config";
import type { WalletConfigRepository } from "../domain/wallet-config.repository";

interface BackendBonus {
  bonusAmountFcfa: number;
  maxEligibleDrivers: number;
  consumedCount: number;
  remainingSlots: number;
  isActive: boolean;
}

export const toWelcomeBonus = (b: BackendBonus): WelcomeBonus => ({ amount: b.bonusAmountFcfa, maxDrivers: b.maxEligibleDrivers, consumed: b.consumedCount, remaining: b.remainingSlots, active: b.isActive });

const KEYS: Array<keyof WalletConfig> = ["consolidationEnabled", "consolidationFeeRate", "consolidationMinAmount", "p2pTransferEnabled", "p2pTransferFeeRate", "p2pMinimumAmount", "withdrawalMinMobileMoney", "withdrawalMinBankTransfer", "grantMaxPerBeneficiary", "grantMaxTotal", "grantMaxBeneficiaries"];

export class HttpWalletConfigRepository implements WalletConfigRepository {
  async config() {
    const c = await http.get<WalletConfig>(API.wallet.config);
    return Object.fromEntries(KEYS.map((k) => [k, c[k]])) as unknown as WalletConfig;
  }
  async saveConfig(c: WalletConfig) {
    await http.patch(API.wallet.config, c);
  }
  async welcomeBonus() {
    return toWelcomeBonus(await http.get<BackendBonus>(API.driverBonus.welcomeBonus));
  }
  async saveWelcomeBonus(b: WelcomeBonus) {
    await http.patch(API.driverBonus.welcomeBonus, { bonusAmountFcfa: b.amount, maxEligibleDrivers: b.maxDrivers, isActive: b.active });
  }
}
