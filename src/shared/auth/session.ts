import type { Role } from "./permissions";

/** Agent connecté au back-office. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Nom du cookie httpOnly posé par `/api/auth/login`. */
export const SESSION_COOKIE = "wami_admin_session";
