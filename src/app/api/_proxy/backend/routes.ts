import "server-only";

/**
 * Routes du back-office qui existent réellement dans le backend WAMI (`wami-co`).
 * Toute autre route reste servie par le faux backend (`../mock`), même quand
 * `WAMI_API_URL` est défini, tant que le backend ne l'expose pas.
 *
 * Le navigateur appelle `/api/v1/<chemin>` ; le backend expose `/api/<chemin>`.
 * Les segments `:x` valent un identifiant.
 */
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const REAL: Array<[Method | "*", string]> = [];

export function declareReal(method: Method | "*", pattern: string): void {
  REAL.push([method, pattern]);
}

function matches(pattern: string, path: string): boolean {
  const p = pattern.split("/");
  const s = path.split("/");
  return p.length === s.length && p.every((seg, i) => seg.startsWith(":") || seg === s[i]);
}

/** `path` : chemin tel que reçu par le proxy, ex. `/v1/admin/drivers/abc/suspend`. */
export function isRealRoute(method: string, path: string): boolean {
  const m = method.toUpperCase();
  return REAL.some(([rm, pattern]) => (rm === "*" || rm === m) && matches(pattern, path));
}

/** `/v1/admin/x` → `/api/admin/x`. */
export function toBackendPath(path: string): string {
  return path.replace(/^\/v1\//, "/api/");
}
