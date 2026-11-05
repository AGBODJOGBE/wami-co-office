/** Chauffeurs et livreurs partenaires (comptes actifs). */

export type DriverStatus = "active" | "suspended" | "blocked";

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
  blocked: "Bloqué (pièce expirée)",
};

export interface Driver {
  id: string;
  name: string;
  phone: string;
  activities: Array<"driver" | "courier">;
  vehicle: string;
  status: DriverStatus;
  online: boolean;
  rating: number;
  acceptanceRate: number;
  missionsTotal: number;
  joinedAt: string;
  /** Pièces qui expirent dans les 30 jours. */
  documentsExpiringSoon: number;
  suspensionReason: string | null;
}

/** Signaux qui méritent un regard de l'équipe. */
export function riskFlags(d: Driver): string[] {
  const flags: string[] = [];
  if (d.rating < 4.2) flags.push("Note basse");
  if (d.acceptanceRate < 0.6) flags.push("Refuse beaucoup d’offres");
  if (d.documentsExpiringSoon > 0) flags.push("Pièce bientôt expirée");
  return flags;
}

export function statusChangeBlocker(d: Driver, next: DriverStatus, reason: string): string | null {
  if (d.status === next) return "Le compte a déjà ce statut.";
  if (next === "blocked") return "Le blocage est automatique (pièce expirée), pas manuel.";
  if (next === "suspended" && reason.trim().length < 10) return "Motif de suspension obligatoire (10 caractères minimum).";
  if (next === "active" && d.status === "blocked") return "Le partenaire doit d’abord renvoyer la pièce expirée.";
  return null;
}
