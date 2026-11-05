import type { WalletConfig, WelcomeBonus } from "./wallet-config";

export interface WalletConfigRepository {
  config(): Promise<WalletConfig>;
  saveConfig(c: WalletConfig): Promise<void>;
  welcomeBonus(): Promise<WelcomeBonus>;
  saveWelcomeBonus(b: WelcomeBonus): Promise<void>;
}
