/** Règles de la plateforme sur les portefeuilles et bonus de bienvenue des chauffeurs. */

export interface WalletConfig {
  consolidationEnabled: boolean;
  /** Fraction entre 0 et 1. */
  consolidationFeeRate: number;
  consolidationMinAmount: number;
  p2pTransferEnabled: boolean;
  p2pTransferFeeRate: number;
  p2pMinimumAmount: number;
  withdrawalMinMobileMoney: number;
  withdrawalMinBankTransfer: number;
  grantMaxPerBeneficiary: number;
  grantMaxTotal: number;
  grantMaxBeneficiaries: number;
}

export interface WelcomeBonus {
  amount: number;
  maxDrivers: number;
  consumed: number;
  remaining: number;
  active: boolean;
}

export function walletConfigBlocker(c: WalletConfig): string | null {
  for (const r of [c.consolidationFeeRate, c.p2pTransferFeeRate]) {
    if (!(r >= 0 && r <= 0.5)) return "Les frais doivent être compris entre 0 % et 50 %.";
  }
  const amounts = [c.consolidationMinAmount, c.p2pMinimumAmount, c.withdrawalMinMobileMoney, c.withdrawalMinBankTransfer, c.grantMaxPerBeneficiary, c.grantMaxTotal, c.grantMaxBeneficiaries];
  if (amounts.some((a) => !Number.isInteger(a) || a < 0)) return "Les montants et plafonds sont des entiers positifs.";
  if (c.grantMaxTotal < c.grantMaxPerBeneficiary) return "Le plafond total d'une dotation doit couvrir au moins un bénéficiaire.";
  return null;
}

export function welcomeBonusBlocker(b: WelcomeBonus): string | null {
  if (!Number.isInteger(b.amount) || b.amount < 0) return "Montant du bonus invalide.";
  if (!Number.isInteger(b.maxDrivers) || b.maxDrivers < b.consumed) return `Le nombre de places ne peut pas être inférieur aux ${b.consumed} déjà consommées.`;
  return null;
}
