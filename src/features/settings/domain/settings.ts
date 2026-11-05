/** Paramètres de la plateforme (règles communes à tous les services). */

export interface PlatformSettings {
  /** Temps laissé au partenaire pour accepter une offre de course. */
  offerAcceptSeconds: number;
  /** Temps laissé à un restaurant pour accepter une commande. */
  orderAcceptMinutes: number;
  /** Jour du versement hebdomadaire (1 = lundi … 7 = dimanche). */
  payoutWeekday: number;
  payoutMinimum: number;
  supportSlaMinutes: number;
  sosPhone: string;
  maintenanceMessage: string;
}

export const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function settingsBlocker(s: PlatformSettings): string | null {
  if (s.offerAcceptSeconds < 10 || s.offerAcceptSeconds > 60) return "Délai d’acceptation d’une offre : entre 10 et 60 secondes.";
  if (s.orderAcceptMinutes < 1 || s.orderAcceptMinutes > 10) return "Délai d’acceptation d’une commande : entre 1 et 10 minutes.";
  if (s.payoutWeekday < 1 || s.payoutWeekday > 7) return "Jour de versement invalide.";
  if (s.payoutMinimum < 0 || s.payoutMinimum > 50_000) return "Versement minimum : entre 0 et 50 000 F.";
  if (s.supportSlaMinutes < 5 || s.supportSlaMinutes > 1440) return "Délai de réponse support : entre 5 minutes et 24 heures.";
  if (!/^\+229\s?\d{2}(\s?\d{2}){3,4}$/.test(s.sosPhone.trim())) return "Numéro SOS au format +229 XX XX XX XX (XX).";
  return null;
}
