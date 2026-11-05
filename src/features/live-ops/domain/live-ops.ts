/** Pilotage et opérations en direct : missions en cours, alertes, vue d'ensemble. */

export type ServiceKind = "ride" | "parcel" | "meal" | "bus";

export const SERVICE_LABELS: Record<ServiceKind, string> = {
  ride: "Courses",
  parcel: "Colis",
  meal: "Repas",
  bus: "Bus",
};

export type MissionStatus = "searching" | "toPickup" | "atPickup" | "inProgress" | "late" | "sos" | "boarding";

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  searching: "Recherche",
  toPickup: "En approche",
  atPickup: "Sur place",
  inProgress: "En cours",
  late: "En retard",
  sos: "SOS",
  boarding: "Embarquement",
};

export interface TimelineStep {
  at: string;
  label: string;
  alert?: boolean;
}

export interface Mission {
  id: string;
  kind: ServiceKind;
  label: string;
  status: MissionStatus;
  partnerName: string | null;
  customerName: string;
  pickup: string;
  dropoff: string;
  price: number;
  payment: "cash" | "wallet" | "momo";
  etaMinutes: number | null;
  /** Retard en minutes (statut « late »). */
  delayMinutes?: number;
  position: [number, number];
  createdAt: string;
  sosAcknowledgedBy: string | null;
  timeline: TimelineStep[];
}

export type IncidentType = "sos" | "lostItem" | "customerUnreachable" | "accident" | "other";

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  sos: "SOS",
  lostItem: "Objet oublié",
  customerUnreachable: "Client injoignable",
  accident: "Accident",
  other: "Autre",
};

export interface Incident {
  id: string;
  missionId: string;
  type: IncidentType;
  summary: string;
  openedAt: string;
  status: "open" | "resolved";
}

/** Vue d'ensemble du tableau de bord. */
export interface ServiceStats {
  kind: ServiceKind | "lodging" | "rental";
  label: string;
  missions: number;
  volume: number;
  commission: number;
  /** Variation vs même jour la semaine précédente (0.06 = +6 %). */
  trend: number;
}

export interface TodoItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
}

export interface Overview {
  volume: number;
  commission: number;
  completedMissions: number;
  onlinePartners: number;
  activePartners: number;
  cancellationRate: number;
  byService: ServiceStats[];
  hourly: number[];
  todo: TodoItem[];
}

// ─── Règles ─────────────────────────────────────────────────────────────────

/** SOS non encore pris en charge par un agent. */
export function isOpenAlert(m: Mission): boolean {
  return m.status === "sos" && m.sosAcknowledgedBy === null;
}

const PRIORITY: Record<MissionStatus, number> = {
  sos: 0,
  late: 1,
  searching: 2,
  atPickup: 3,
  toPickup: 4,
  inProgress: 5,
  boarding: 6,
};

/** Ordre de traitement : SOS, retards, sans partenaire, puis le reste. */
export function sortByPriority(missions: Mission[]): Mission[] {
  return [...missions].sort((a, b) => PRIORITY[a.status] - PRIORITY[b.status] || a.createdAt.localeCompare(b.createdAt));
}

/** On ne réassigne qu'avant la prise en charge du client ou du colis. */
export function reassignBlocker(m: Mission): string | null {
  if (m.kind === "bus") return "Un départ de bus ne se réassigne pas.";
  if (m.status === "inProgress" || m.status === "sos") return "Mission déjà démarrée : utilisez l’annulation ou un incident.";
  return null;
}

export function cancelBlocker(m: Mission, reason: string): string | null {
  if (m.kind === "bus") return "Un départ de bus s’annule depuis la compagnie.";
  if (reason.trim().length < 5) return "Indiquez le motif de l’annulation (5 caractères minimum).";
  return null;
}

export function countByKind(missions: Mission[]): Record<ServiceKind, number> {
  const out: Record<ServiceKind, number> = { ride: 0, parcel: 0, meal: 0, bus: 0 };
  for (const m of missions) out[m.kind] += 1;
  return out;
}
