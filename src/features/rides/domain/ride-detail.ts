/** Détail d'une course pour le support : matching, télémétrie, trace GPS, règlement de la garantie. */

export interface Unavailable {
  available: false;
  reason: string;
}

export type Section<T> = ({ available: true } & T) | Unavailable;

export interface KeyValue {
  key: string;
  value: string;
}

export interface MatchingCycleView {
  at: string;
  trigger: string;
  vehicleType: string;
  outcome: string;
  radii: string;
}

export interface MatchingView {
  cycles: MatchingCycleView[];
  milestones: Array<{ at: string; code: string; detail: string | null }>;
  facts: KeyValue[];
}

export interface TrackView {
  pointCount: number;
  sampledCount: number;
  truncated: boolean;
  segments: Array<{ status: string; from: string; to: string; points: number }>;
}

export interface SettlementView {
  facts: KeyValue[];
  movements: Array<{ id: string; at: string; label: string; direction: string; amount: number; isMarker: boolean }>;
}

export interface RideDetail {
  telemetry: Section<{ facts: KeyValue[] }>;
  matching: Section<MatchingView>;
  track: Section<TrackView>;
}

/** Explications lisibles des raisons d'indisponibilité renvoyées par le backend. */
export const UNAVAILABLE_LABELS: Record<string, string> = {
  RIDE_NOT_TERMINAL_YET: "La course n'est pas encore terminée.",
  NO_TELEMETRY_RECORDED: "Aucune télémétrie enregistrée pour cette course.",
  NOT_TRACED: "Le matching de cette course n'a pas été tracé.",
  PURGED_TTL: "La trace GPS a été purgée (durée de conservation dépassée).",
  NOT_RECORDED: "La trace GPS n'a pas été enregistrée.",
  PRE_TELEMETRY_CUTOVER: "Course antérieure à la mise en service de la télémétrie.",
};

export const unavailableLabel = (reason: string) => UNAVAILABLE_LABELS[reason] ?? reason;

const FIELD_LABELS: Record<string, string> = {
  outcome: "Issue",
  dataAvailability: "Données disponibles",
  distances: "Distances",
  durations: "Durées",
  decisions: "Décisions du système",
  signal: "Qualité du signal GPS",
};

/** Aplatit un objet imbriqué en lignes « chemin : valeur » (dates ISO raccourcies, booléens en oui/non). */
export function flatten(value: unknown, prefix = ""): KeyValue[] {
  if (value === null || value === undefined) return prefix ? [{ key: prefix, value: "—" }] : [];
  if (Array.isArray(value)) {
    if (value.length === 0) return prefix ? [{ key: prefix, value: "—" }] : [];
    if (value.every((v) => typeof v !== "object" || v === null)) return [{ key: prefix, value: value.join(", ") }];
    return value.flatMap((v, i) => flatten(v, `${prefix}[${i + 1}]`));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => flatten(v, prefix ? `${prefix} › ${FIELD_LABELS[k] ?? k}` : (FIELD_LABELS[k] ?? k)));
  }
  if (typeof value === "boolean") return [{ key: prefix, value: value ? "oui" : "non" }];
  return [{ key: prefix, value: String(value) }];
}
