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
