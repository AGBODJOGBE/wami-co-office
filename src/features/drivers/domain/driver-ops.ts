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

/** Champs modifiables d'un chauffeur par un agent. Un champ vide n'est pas envoyé (donc pas modifié). */
export interface DriverInfoDraft {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: "" | "MALE" | "FEMALE";
  city: string;
  quarter: string;
  street: string;
  landmark: string;
}

export const emptyInfo = (): DriverInfoDraft => ({ firstName: "", lastName: "", phoneNumber: "", email: "", gender: "", city: "", quarter: "", street: "", landmark: "" });

/** Prérempli avec le nom et le téléphone déjà connus. */
export function infoFrom(name: string, phone: string): DriverInfoDraft {
  const [firstName = "", ...rest] = name.trim().split(" ");
  return { ...emptyInfo(), firstName, lastName: rest.join(" "), phoneNumber: phone };
}

export function infoBlocker(d: DriverInfoDraft, original: DriverInfoDraft): string | null {
  const changed = (Object.keys(d) as Array<keyof DriverInfoDraft>).filter((k) => d[k].trim() !== original[k].trim() && d[k].trim() !== "");
  if (changed.length === 0) return "Aucune modification.";
  if (d.phoneNumber.trim() && !/^\+?[0-9 ]{8,15}$/.test(d.phoneNumber.trim())) return "Numéro de téléphone invalide.";
  if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return "Adresse e-mail invalide.";
  const address = [d.city, d.quarter, d.street, d.landmark].some((v) => v.trim());
  if (address && (!d.city.trim() || !d.quarter.trim())) return "Une adresse exige au moins la ville et le quartier.";
  return null;
}

/** Corps de `PATCH /api/admin/drivers/:id/info` : uniquement les champs renseignés et modifiés. */
export function infoBody(d: DriverInfoDraft, original: DriverInfoDraft) {
  const diff = (k: keyof DriverInfoDraft) => (d[k].trim() !== "" && d[k].trim() !== original[k].trim() ? d[k].trim() : undefined);
  const address = d.city.trim() && d.quarter.trim() ? { city: d.city.trim(), quarter: d.quarter.trim(), ...(d.street.trim() ? { street: d.street.trim() } : {}), ...(d.landmark.trim() ? { landmark: d.landmark.trim() } : {}) } : undefined;
  return { firstName: diff("firstName"), lastName: diff("lastName"), phoneNumber: diff("phoneNumber"), email: diff("email"), gender: diff("gender"), address };
}
