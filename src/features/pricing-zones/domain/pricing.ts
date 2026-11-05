/** Zones de service, grilles tarifaires et commissions WAMI. */

export interface Zone {
  id: string;
  name: string;
  color: string;
  status: "active" | "soon";
  polygon: Array<[number, number]>;
}

export interface Tariff {
  service: string;
  label: string;
  base: number;
  perKm: number;
  perMin: number;
  minimum: number;
  freeWaitMin: number;
  waitPerMin: number;
  /** Pause demandée par le client pendant la course (0 = non proposé). */
  pausePerMin: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Commission {
  activity: string;
  rate: number | null;
  collection: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Estimation du prix d'une course, arrondie à 50 F (règle d'arrondi à valider). */
export function estimateFare(t: Tariff, km: number, minutes: number): number {
  const raw = t.base + t.perKm * km + t.perMin * minutes;
  return Math.max(t.minimum, Math.round(raw / 50) * 50);
}

export function tariffBlocker(t: Tariff): string | null {
  const values = [t.base, t.perKm, t.perMin, t.minimum, t.freeWaitMin, t.waitPerMin, t.pausePerMin];
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return "Les montants ne peuvent pas être négatifs.";
  if (t.perKm === 0 && t.perMin === 0) return "Il faut un prix au km ou à la minute.";
  if (t.minimum < t.base) return "Le minimum doit être au moins égal à la prise en charge.";
  if (t.freeWaitMin > 15) return "Attente gratuite : 15 minutes maximum.";
  return null;
}
