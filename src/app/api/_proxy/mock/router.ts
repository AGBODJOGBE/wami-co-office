import "server-only";
import { can, type Module } from "@/shared/auth/permissions";
import type { SessionUser } from "@/shared/auth/session";

/**
 * Mini-routeur du faux backend. Chaque route déclare son module : les
 * écritures sont refusées (403) si le rôle n'a pas le droit, comme le ferait
 * le vrai backend.
 */
export interface MockContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
  user: SessionUser;
}

export interface MockRoute {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  module: Module;
  handler: (ctx: MockContext) => unknown;
}

export class MockError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Élément introuvable.") => new MockError(404, what, "not_found");
export const invalid = (message: string) => new MockError(422, message, "validation");

export function route(method: MockRoute["method"], path: string, module: Module, handler: MockRoute["handler"]): MockRoute {
  return { method, path, module, handler };
}

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i]!.startsWith(":")) params[p[i]!.slice(1)] = decodeURIComponent(s[i]!);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export async function dispatch(
  routes: MockRoute[],
  method: string,
  path: string,
  query: URLSearchParams,
  body: Record<string, unknown>,
  user: SessionUser,
): Promise<Response> {
  for (const r of routes) {
    if (r.method !== method) continue;
    const params = match(r.path, path);
    if (!params) continue;
    const need = method === "GET" ? "read" : "write";
    if (!can(user.role, r.module, need)) {
      return Response.json({ message: "Votre rôle ne permet pas cette action.", code: "forbidden" }, { status: 403 });
    }
    try {
      // Petite latence pour voir les états de chargement.
      await new Promise((res) => setTimeout(res, 250));
      return Response.json(await r.handler({ params, query, body, user }));
    } catch (e) {
      if (e instanceof MockError) return Response.json({ message: e.message, code: e.code }, { status: e.status });
      return Response.json({ message: "Erreur du faux backend." }, { status: 500 });
    }
  }
  return Response.json({ message: `Route inconnue du faux backend : ${method} ${path}` }, { status: 404 });
}
