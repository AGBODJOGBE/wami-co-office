import "server-only";

export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
export const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
export const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
export const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

/** Prochain jour de la semaine donné (1 = lundi … 7 = dimanche), à 8 h. */
export function nextWeekday(weekday: number): string {
  const d = new Date();
  const today = d.getDay() === 0 ? 7 : d.getDay();
  const delta = (weekday - today + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}
