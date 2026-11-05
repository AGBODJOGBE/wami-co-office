/** Comptes utilisateurs de la plateforme (passagers, chauffeurs, partenaires, admins). */

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

export const USER_ROLE_LABELS: Record<string, string> = { PASSENGER: "Passager", DRIVER: "Chauffeur", PARTNER: "Partenaire", ADMIN: "Administrateur" };

export const roleLabel = (r: string) => USER_ROLE_LABELS[r] ?? r;

export interface UserFilter {
  q: string;
  role: string;
  state: "all" | "active" | "inactive";
}

export function searchBlocker(q: string): string | null {
  const t = q.trim();
  return t.length === 0 || t.length >= 2 ? null : "Saisissez 2 caractères minimum.";
}
