/** Portefeuilles WAMI des clients, partenaires (chauffeurs) et de la plateforme. */

export interface WalletMovement {
  id: string;
  at: string;
  label: string;
  /** Positif = crédit, négatif = débit. */
  amount: number;
}

export interface Wallet {
  id: string;
  ownerName: string;
  ownerType: "client" | "partner" | "establishment" | "platform";
  phone: string;
  balance: number;
  status: "active" | "frozen";
  /** Retraits bloqués par un admin (le portefeuille reste utilisable). */
  withdrawalsBlocked: boolean;
  withdrawalsBlockedReason: string | null;
  /** Chargés à la sélection du portefeuille. */
  movements: WalletMovement[];
}

export const MIN_REASON = 10;

export function blockBlocker(w: Wallet, reason: string): string | null {
  if (w.withdrawalsBlocked) return "Les retraits sont déjà bloqués.";
  if (reason.trim().length < MIN_REASON) return `Motif obligatoire (${MIN_REASON} caractères minimum).`;
  return null;
}

export function unblockBlocker(w: Wallet): string | null {
  return w.withdrawalsBlocked ? null : "Les retraits ne sont pas bloqués.";
}

/** Ajustement manuel au-delà duquel un super admin doit le faire. À valider. (Route absente du backend : faux backend.) */
export const LARGE_ADJUSTMENT = 100_000;

export function adjustmentBlocker(w: Wallet, amount: number, reason: string, isSuperAdmin: boolean): string | null {
  if (w.status === "frozen") return "Portefeuille gelé : dégelez-le d’abord.";
  if (!Number.isInteger(amount) || amount === 0) return "Montant invalide (positif pour créditer, négatif pour débiter).";
  if (Math.abs(amount) > LARGE_ADJUSTMENT && !isSuperAdmin) return `Au-delà de ${LARGE_ADJUSTMENT} F, un super admin doit valider.`;
  if (w.ownerType === "client" && w.balance + amount < 0) return "Un portefeuille client ne peut pas devenir négatif.";
  if (reason.trim().length < 10) return "Motif obligatoire (10 caractères minimum).";
  return null;
}
