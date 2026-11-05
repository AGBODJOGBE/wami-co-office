/** Parrainage clients : un client invite un proche, les deux sont récompensés. */

export interface ReferralProgram {
  active: boolean;
  referrerReward: number;
  refereeReward: number;
  /** Missions que le filleul doit terminer pour débloquer les récompenses. */
  requiredMissions: number;
}

export interface Referral {
  id: string;
  referrerName: string;
  refereeName: string;
  createdAt: string;
  missionsDone: number;
  status: "pending" | "rewarded" | "flagged";
  /** Signal de fraude détecté (même appareil, même numéro…). */
  suspicion: string | null;
}

export const isEligible = (r: Referral, p: ReferralProgram) => r.status === "pending" && r.missionsDone >= p.requiredMissions;

export function programBlocker(p: ReferralProgram): string | null {
  for (const v of [p.referrerReward, p.refereeReward]) {
    if (!Number.isInteger(v) || v < 0 || v > 5000) return "Récompenses entre 0 et 5 000 F.";
  }
  if (!Number.isInteger(p.requiredMissions) || p.requiredMissions < 1 || p.requiredMissions > 10) return "Missions requises entre 1 et 10.";
  return null;
}
