import { fail, guard } from "@/shared/lib/result";
import { walletConfigBlocker, welcomeBonusBlocker, type WalletConfig, type WelcomeBonus } from "../domain/wallet-config";
import type { WalletConfigRepository } from "../domain/wallet-config.repository";
import { HttpWalletConfigRepository } from "./wallet-config.http-repository";

export function createWalletConfigUseCases(repo: WalletConfigRepository) {
  return {
    config: () => guard(() => repo.config()),
    welcomeBonus: () => guard(() => repo.welcomeBonus()),
    saveConfig: async (c: WalletConfig) => {
      const blocker = walletConfigBlocker(c);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveConfig(c));
    },
    saveWelcomeBonus: async (b: WelcomeBonus) => {
      const blocker = welcomeBonusBlocker(b);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.saveWelcomeBonus(b));
    },
  };
}

export const walletConfigUseCases = createWalletConfigUseCases(new HttpWalletConfigRepository());
