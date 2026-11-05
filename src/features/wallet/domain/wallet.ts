/** Portefeuilles WAMI des clients, partenaires et établissements. */

export interface WalletMovement {
  id: string;
  at: string;
  label: string;
  amount: number;
}

export interface Wallet {
  id: string;
  ownerName: string;
  ownerType: "client" | "partner" | "establishment";
  phone: string;
  balance: number;
  status: "active" | "frozen";
  movements: WalletMovement[];
}

/** Ajustement manuel au-delà duquel un super admin doit le faire. À valider. */
export const LARGE_ADJUSTMENT = 100_000;

export function adjustmentBlocker(w: Wallet, amount: number, reason: string, isSuperAdmin: boolean): string | null {
  if (w.status === "frozen") return "Portefeuille gelé : dégelez-le d’abord.";
  if (!Number.isInteger(amount) || amount === 0) return "Montant invalide (positif pour créditer, négatif pour débiter).";
  if (Math.abs(amount) > LARGE_ADJUSTMENT && !isSuperAdmin) return `Au-delà de ${LARGE_ADJUSTMENT} F, un super admin doit valider.`;
  if (w.ownerType === "client" && w.balance + amount < 0) return "Un portefeuille client ne peut pas devenir négatif.";
  if (reason.trim().length < 10) return "Motif obligatoire (10 caractères minimum).";
  return null;
}
