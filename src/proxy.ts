import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/shared/auth/session";

/**
 * Contrôle optimiste : sans cookie de session, toute page renvoie vers /login.
 * La vérification réelle (signature, expiration, droits) est faite par les
 * route handlers et par le backend.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = request.nextUrl.pathname === "/login";
  if (!hasSession && !isLogin) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  if (hasSession && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  // Pages uniquement : ni les routes /api, ni les fichiers Next et statiques.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|woff2?|ttf)$).*)"],
};
