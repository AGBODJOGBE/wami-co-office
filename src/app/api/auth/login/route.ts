import { NextResponse, type NextRequest } from "next/server";
import { ROLES, roleFromPermissions, type Role } from "@/shared/auth/permissions";
import { SESSION_COOKIE, type SessionUser } from "@/shared/auth/session";
import { encodeSession, SESSION_TTL_SECONDS } from "../../_proxy/session";

/** Code de démonstration (faux backend uniquement). */
const DEMO_CODE = "123456";

interface LoginBody {
  email?: string;
  code?: string;
  phone?: string;
  password?: string;
  role?: Role;
}

/** Réponse de `POST /api/admin/login` du backend WAMI (enveloppée dans `{ success, data }`). */
interface BackendLogin {
  success: boolean;
  data?: {
    token: string;
    admin: {
      adminId: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: { id: string; name: string; displayName: string };
      permissions: string[];
    };
  };
  error?: { message?: string };
}

/**
 * Connexion. Avec `WAMI_API_URL` : téléphone + mot de passe, vérifiés par
 * `POST /api/admin/login` du backend WAMI, qui renvoie le jeton et les permissions.
 * Sans backend : e-mail + code de démonstration.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;

  let user: SessionUser;
  let token: string | undefined;

  if (process.env.WAMI_API_URL) {
    const phone = (body.phone ?? "").trim();
    if (!phone || !body.password) return NextResponse.json({ message: "Téléphone et mot de passe requis." }, { status: 422 });
    const res = await fetch(`${process.env.WAMI_API_URL.replace(/\/$/, "")}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password: body.password }),
      cache: "no-store",
    }).catch(() => null);
    if (!res) return NextResponse.json({ message: "Le backend WAMI ne répond pas." }, { status: 502 });
    const data = (await res.json().catch(() => null)) as BackendLogin | null;
    if (!res.ok || !data?.success || !data.data) {
      const message = res.status === 429 ? "Trop de tentatives. Réessayez plus tard." : res.status >= 500 ? "Le backend WAMI a échoué." : "Téléphone ou mot de passe incorrect.";
      return NextResponse.json({ message }, { status: res.status === 429 ? 429 : res.status >= 500 ? 502 : 401 });
    }
    const a = data.data.admin;
    user = {
      id: a.adminId,
      name: `${a.firstName} ${a.lastName}`.trim(),
      email: a.phone,
      role: roleFromPermissions(a.permissions),
      roleName: a.role.displayName,
      permissions: a.permissions,
    };
    token = data.data.token;
  } else {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ message: "Adresse e-mail invalide." }, { status: 422 });
    }
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
