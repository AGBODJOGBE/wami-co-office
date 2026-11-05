/** Opérations sur les chauffeurs : candidatures, chauffeurs en ligne, sessions de connexion, type d'activité. */

export type DriverType = "VTC" | "DELIVERY" | "BOTH";
export const DRIVER_TYPE_LABELS: Record<DriverType, string> = { VTC: "Courses (VTC)", DELIVERY: "Livraisons", BOTH: "Courses et livraisons" };

export interface PendingDriver {
  id: string;
  userId: string;
  documentsVerified: boolean;
  createdAt: string;
}

export interface OnlineDriver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalRides: number;
  latitude: number;
  longitude: number;
  vehicle: string;
  inRide: boolean;
  updatedAt: string;
}

export interface DriverSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  endReason: string | null;
}

export interface DriverSessions {
  sessions: DriverSession[];
  totalSeconds: number;
}

export function approveBlocker(p: PendingDriver): string | null {
  return p.documentsVerified ? null : "Les documents ne sont pas encore vérifiés (écran Vérifications).";
}

export function typeBlocker(current: DriverType, next: DriverType): string | null {
  return current === next ? "Le chauffeur a déjà ce type d'activité." : null;
}

export function hoursLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export const END_REASON_LABELS: Record<string, string> = { LOGOUT: "Déconnexion", SUPERSEDED: "Autre appareil", TIMEOUT: "Inactivité" };
