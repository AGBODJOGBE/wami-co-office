import { NextResponse, type NextRequest } from "next/server";
import { ROLES, type Role } from "@/shared/auth/permissions";
import { SESSION_COOKIE, type SessionUser } from "@/shared/auth/session";
import { encodeSession, SESSION_TTL_SECONDS } from "../../_proxy/session";

/** Code de démonstration (faux backend uniquement). */
const DEMO_CODE = "123456";

interface LoginBody {
  email?: string;
  code?: string;
  role?: Role;
}

/**
 * Connexion par e-mail + code à usage unique.
 * Avec `WAMI_API_URL`, le backend vérifie le code et renvoie l'agent et son jeton
 * (contrat à valider : POST /v1/admin/auth/login → { token, user }).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: "Adresse e-mail invalide." }, { status: 422 });
  }

  let user: SessionUser;
  let token: string | undefined;

  if (process.env.WAMI_API_URL) {
    const res = await fetch(`${process.env.WAMI_API_URL.replace(/\/$/, "")}/v1/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: body.code }),
      cache: "no-store",
    }).catch(() => null);
    if (!res) return NextResponse.json({ message: "Le backend WAMI ne répond pas." }, { status: 502 });
    if (!res.ok) return NextResponse.json({ message: "Code incorrect ou expiré." }, { status: 401 });
    const data = (await res.json()) as { token: string; user: SessionUser };
    user = data.user;
    token = data.token;
  } else {
    if (body.code !== DEMO_CODE) {
      return NextResponse.json({ message: `Code incorrect. En démonstration : ${DEMO_CODE}.` }, { status: 401 });
    }
    const role: Role = body.role && ROLES.includes(body.role) ? body.role : "superAdmin";
    user = { id: `agent-${role}`, name: "[Agent démo]", email, role };
  }

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, encodeSession({ user, token, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
