/** Recherche globale (barre du haut). */

export type SearchKind = "mission" | "driver" | "establishment" | "client" | "ticket";

export const SEARCH_KIND_LABELS: Record<SearchKind, string> = {
  mission: "Missions",
  driver: "Chauffeurs et livreurs",
  establishment: "Établissements",
  client: "Clients",
  ticket: "Tickets support",
};

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  /** Page du back-office où ouvrir le résultat. */
  href: string;
}

export const MIN_QUERY = 2;

export function normalizeQuery(q: string): string {
  return q.trim().replace(/\s+/g, " ");
}

export function groupByKind(hits: SearchHit[]): Array<[SearchKind, SearchHit[]]> {
  const groups = new Map<SearchKind, SearchHit[]>();
  for (const h of hits) groups.set(h.kind, [...(groups.get(h.kind) ?? []), h]);
  return [...groups.entries()];
}
