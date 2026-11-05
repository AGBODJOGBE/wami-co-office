/** Formatage à la française pour tout le back-office. */
const NBSP = " ";

/** 12500 → « 12 500 F » ; signed → « + 12 500 F ». */
export function fcfa(amount: number, opts: { signed?: boolean; unit?: boolean } = {}): string {
  const { signed = false, unit = true } = opts;
  const abs = Math.round(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const sign = amount < 0 ? "− " : signed && amount > 0 ? "+ " : "";
  return `${sign}${abs}${unit ? " F" : ""}`;
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace(".", ",")} %`;
}

const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « mer. 4 nov. » */
export function dayMonth(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** « 14:05 » */
export function hhmm(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** « 4 nov. 14:05 » */
export function dateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hhmm(d)}`;
}

/** « il y a 3 min », « il y a 2 h », « il y a 3 j ». */
export function ago(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const min = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function initials(name: string): string {
  return name
    .replace(/[[\]]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
