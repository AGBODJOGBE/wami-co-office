import type { Role } from "./permissions";

/** Agent connecté au back-office. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Rôle tel que nommé par le backend (affichage). */
  roleName?: string;
  /** Permissions effectives renvoyées par le backend (`wallet.view_all`…). Absent en démonstration. */
  permissions?: string[];
}

/** Nom du cookie httpOnly posé par `/api/auth/login`. */
export const SESSION_COOKIE = "wami_admin_session";
