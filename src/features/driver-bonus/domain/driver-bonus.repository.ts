import type { BonusConfig, BonusEntry, BonusFamily, BonusLedger, BonusRunConfig } from "./bonus";

export interface DriverBonusRepository {
  configs(family: BonusFamily): Promise<BonusConfig[]>;
  activate(c: BonusConfig): Promise<void>;
  deactivate(c: BonusConfig): Promise<void>;
  remove(c: BonusConfig): Promise<void>;
  entries(ledger: BonusLedger): Promise<BonusEntry[]>;
  runConfig(): Promise<BonusRunConfig>;
  saveRunConfig(cfg: BonusRunConfig): Promise<void>;
}
