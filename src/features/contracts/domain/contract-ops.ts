/** Contrats : indicateurs de flotte, journal d'audit, alertes, prélèvement sur les revenus et déblocage d'un chauffeur. */
import type { LeaseContract } from "./lease-contract";

export interface FleetKpis {
  contracts: { total: number; active: number; suspended: number; completed: number; broken: number };
  paid: number;
  remaining: number;
  residualDebt: number;
  overdueInstallments: number;
  atRisk: number;
  blocked: number;
  /** Nombre d'échéances impayées qui bloque un chauffeur. */
  blockThreshold: number;
}

export interface AuditLine {
  id: string;
  action: string;
  contractId: string | null;
  driverId: string | null;
  by: string;
  at: string;
  details: string;
}

export interface RevenueShareAlert {
  contractId: string;
  driverId: string;
  unrecognized: number;
  remaining: number;
  lastWithholdingAt: string | null;
  reasons: string[];
}

export interface Withholding {
  id: string;
  amount: number;
  source: string;
  date: string;
}

export const ALERT_REASON_LABELS: Record<string, string> = { DEBT_THRESHOLD_EXCEEDED: "Dette au-dessus du seuil", INACTIVITY: "Chauffeur inactif" };
export const alertReasonLabel = (r: string) => ALERT_REASON_LABELS[r] ?? r;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CONTRACT_CREATED: "Contrat créé",
  CONTRACT_SUSPENDED: "Contrat suspendu",
  CONTRACT_RESUMED: "Contrat repris",
  CONTRACT_BROKEN: "Contrat rompu",
  MANUAL_PAYMENT: "Versement manuel",
  DRIVER_UNBLOCKED: "Chauffeur débloqué",
  REPAYMENT_MODE_SWITCHED: "Passage en prélèvement sur revenus",
  REVENUE_SHARE_RATE_UPDATED: "Taux de prélèvement modifié",
};
export const auditActionLabel = (a: string) => AUDIT_ACTION_LABELS[a] ?? a;

/** Taux de prélèvement : fraction du revenu net, strictement positive et au plus égale à 1 (règle du backend). */
export function rateBlocker(rate: number): string | null {
  return rate > 0 && rate <= 1 ? null : "Le taux doit être supérieur à 0 % et au plus 100 %.";
}

export function switchModeBlocker(c: LeaseContract, rate: number): string | null {
  if (c.repaymentMode === "revenueShare") return "Ce contrat est déjà en prélèvement sur les revenus.";
  if (c.status !== "active" && c.status !== "suspended") return "Seul un contrat actif ou suspendu peut changer de mode.";
  return rateBlocker(rate);
}

export function updateRateBlocker(c: LeaseContract, rate: number): string | null {
  if (c.repaymentMode !== "revenueShare") return "Le taux ne s'applique qu'au prélèvement sur les revenus.";
  return rateBlocker(rate);
}

/** Un chauffeur en défaut (échéances impayées au-delà du seuil) est bloqué ; l'admin peut le débloquer. */
export function unblockBlocker(c: LeaseContract, threshold: number): string | null {
  if (c.status !== "active" && c.status !== "suspended") return "Ce contrat n'est plus actif.";
  return c.unpaidCount >= threshold ? null : `Le chauffeur n'est pas bloqué (moins de ${threshold} échéances impayées).`;
}
