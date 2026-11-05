import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/shared/auth/session";
import { isRealRoute, toBackendPath } from "../../_proxy/backend/routes";
import "../../_proxy/backend/declared";
import { forwardToBackend } from "../../_proxy/forward";
import { handleMock } from "../../_proxy/mock";
import { decodeSession } from "../../_proxy/session";

/**
 * Point d'entrée unique des appels du back-office : `/api/v1/...`.
 * - `WAMI_API_URL` défini et route déclarée réelle (app/api/_proxy/backend) → relais vers le backend WAMI.
 * - sinon → faux backend en mémoire (app/api/_proxy/mock) : développement sans serveur, et modules
 *   que le backend n'expose pas encore.
 */
async function handle(request: NextRequest, ctx: RouteContext<"/api/v1/[...path]">): Promise<Response> {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return Response.json({ message: "Session expirée.", code: "unauthenticated" }, { status: 401 });

  const { path } = await ctx.params;
  const backendPath = `/v1/${path.join("/")}`;

  if (process.env.WAMI_API_URL && isRealRoute(request.method, backendPath)) {
    return forwardToBackend(request, toBackendPath(backendPath), request.nextUrl.search, session.token);
  }

  let body: Record<string, unknown> = {};
  if (request.method !== "GET") {
    const text = await request.text();
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  }
  return handleMock(request.method, backendPath, request.nextUrl.searchParams, body, session.user);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
