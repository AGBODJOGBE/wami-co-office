/** Temps de connexion des chauffeurs par jour (rapport de flotte ou d'un chauffeur). */

export interface DayEntry {
  date: string;
  seconds: number;
}

export interface DriverConnectionReport {
  driverId: string;
  days: DayEntry[];
  totalSeconds: number;
}

export interface ConnectionReport {
  from: string;
  to: string;
  drivers: DriverConnectionReport[];
}

const DAY = 86_400_000;

/** Période valide : dates AAAA-MM-JJ, fin ≥ début, 92 jours maximum. */
export function periodBlocker(from: string, to: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return "Choisissez les deux dates.";
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return "Dates invalides.";
  if (b < a) return "La fin précède le début.";
  if ((b - a) / DAY > 92) return "Période limitée à 92 jours.";
  return null;
}

export const avgHoursPerDay = (r: DriverConnectionReport): number => (r.days.length === 0 ? 0 : r.totalSeconds / 3600 / r.days.length);

/** Chauffeurs triés par temps total décroissant. */
export const ranked = (rows: DriverConnectionReport[]) => [...rows].sort((a, b) => b.totalSeconds - a.totalSeconds);
