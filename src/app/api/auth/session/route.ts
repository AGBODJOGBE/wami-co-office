import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/shared/auth/session";
import { decodeSession } from "../../_proxy/session";

/** Agent connecté (sans le jeton, qui ne quitte jamais le serveur). */
export async function GET(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  return Response.json({ user: session?.user ?? null }, { headers: { "Cache-Control": "no-store" } });
}
