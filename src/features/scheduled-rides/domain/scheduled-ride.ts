/** Courses programmées proches du départ sans chauffeur confirmé : affectation manuelle par un agent. */

export interface Candidate {
  driverId: string;
  name: string;
  phone: string;
  rating: number;
  totalRides: number;
  vehicle: string;
  online: boolean;
  /** Distance au point de prise en charge ; null = position inconnue. */
  distanceM: number | null;
}

export interface ScheduledRide {
  id: string;
  number: string;
  scheduledAt: string;
  minutesLeft: number;
  vehicleType: string;
  from: string;
  to: string;
  price: number;
  guarantee: number | null;
  candidates: Candidate[];
}

export interface ManualAssignmentList {
  thresholdMinutes: number;
  rides: ScheduledRide[];
}

export type Urgency = "critical" | "soon" | "ok";

/** Moins de 15 minutes : critique ; sinon sous le seuil du backend : proche. */
export function urgency(r: ScheduledRide, threshold: number): Urgency {
  if (r.minutesLeft <= 15) return "critical";
  return r.minutesLeft <= threshold ? "soon" : "ok";
}

/** Candidats triés : en ligne d'abord, puis les plus proches, puis les mieux notés. */
export function rankCandidates(list: Candidate[]): Candidate[] {
  return [...list].sort((a, b) => Number(b.online) - Number(a.online) || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity) || b.rating - a.rating);
}

export function assignBlocker(r: ScheduledRide, c: Candidate): string | null {
  if (!r.candidates.some((x) => x.driverId === c.driverId)) return "Ce chauffeur n'est pas proposé pour cette course.";
  if (r.minutesLeft < 0) return "Le départ est déjà passé.";
  return null;
}

export const kmLabel = (m: number | null) => (m === null ? "position inconnue" : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);
