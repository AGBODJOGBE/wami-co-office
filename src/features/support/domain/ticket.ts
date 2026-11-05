/** Support et litiges : tickets clients et partenaires, remboursements. */
import type { Role } from "@/shared/auth/permissions";

export interface TicketMessage {
  id: string;
  from: "requester" | "agent" | "note";
  author: string;
  text: string;
  at: string;
}

export interface LinkedPayment {
  reference: string;
  estimated: number;
  paid: number;
  method: string;
  alreadyRefunded: number;
}

export interface Ticket {
  id: string;
  subject: string;
  category: "refund" | "order" | "lostItem" | "payout" | "booking" | "other";
  requesterName: string;
  requesterKind: "client" | "partner";
  openedAt: string;
  /** Délai de première réponse attendu. */
  slaMinutes: number;
  status: "open" | "waiting" | "closed";
  priority: "normal" | "high";
  assignee: string | null;
  messages: TicketMessage[];
  payment: LinkedPayment | null;
}

/** Plafond de remboursement par rôle ; au-delà, la Finance valide. À valider. */
export const REFUND_CAP: Partial<Record<Role, number>> = { support: 5000 };

export function minutesOpen(t: Ticket, now: Date): number {
  return Math.round((now.getTime() - new Date(t.openedAt).getTime()) / 60000);
}

/** Délai dépassé : aucune réponse d'agent dans le temps prévu. */
export function isOverdue(t: Ticket, now: Date): boolean {
  if (t.status === "closed") return false;
  const answered = t.messages.some((m) => m.from === "agent");
  return !answered && minutesOpen(t, now) > t.slaMinutes;
}

export const refundable = (p: LinkedPayment) => Math.max(0, p.paid - p.alreadyRefunded);

export function refundBlocker(t: Ticket, amount: number, role: Role): string | null {
  if (!t.payment) return "Aucun paiement lié à ce ticket.";
  if (t.status === "closed") return "Ticket clos.";
  if (!Number.isInteger(amount) || amount <= 0) return "Montant invalide.";
  if (amount > refundable(t.payment)) return `Maximum remboursable : ${refundable(t.payment)} F.`;
  const cap = REFUND_CAP[role];
  if (cap !== undefined && amount > cap) return `Au-delà de ${cap} F, la Finance doit valider le remboursement.`;
  return null;
}

export function replyBlocker(t: Ticket, text: string): string | null {
  if (t.status === "closed") return "Ticket clos.";
  if (text.trim().length < 2) return "Message vide.";
  if (text.length > 2000) return "Message trop long (2 000 caractères maximum).";
  return null;
}
