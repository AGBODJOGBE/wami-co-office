/** Primes chauffeurs : « X missions sur la période = Y F de bonus ». */

export interface Challenge {
  id: string;
  title: string;
  zone: string;
  service: "ride" | "delivery" | "all";
  targetMissions: number;
  reward: number;
  startsAt: string;
  endsAt: string;
  participants: number;
  achievers: number;
  archived: boolean;
}

export type ChallengeState = "scheduled" | "running" | "ended" | "archived";

export function state(c: Challenge, now: Date): ChallengeState {
  if (c.archived) return "archived";
  if (now < new Date(c.startsAt)) return "scheduled";
  if (now > new Date(c.endsAt)) return "ended";
  return "running";
}

/** Coût maximal si chaque participant atteint l'objectif. */
export const maxCost = (c: Challenge) => c.participants * c.reward;

/** Coût réel à date. */
export const currentCost = (c: Challenge) => c.achievers * c.reward;

export type ChallengeDraft = Omit<Challenge, "id" | "participants" | "achievers" | "archived">;

export function draftBlocker(d: ChallengeDraft, now: Date): string | null {
  if (d.title.trim().length < 3) return "Titre obligatoire.";
  if (!Number.isInteger(d.targetMissions) || d.targetMissions < 1 || d.targetMissions > 500) return "Objectif entre 1 et 500 missions.";
  if (!Number.isInteger(d.reward) || d.reward < 500) return "Prime minimum : 500 F.";
  const start = new Date(d.startsAt);
  const end = new Date(d.endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Dates invalides.";
  if (end <= start) return "La fin doit être après le début.";
  if (end < now) return "La période est déjà terminée.";
  return null;
}
