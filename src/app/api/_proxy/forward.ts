import "server-only";

/**
 * Relaie une requête du back-office vers le backend WAMI (`WAMI_API_URL`)
 * en ajoutant le jeton de l'agent. Le corps et le statut sont renvoyés tels quels.
 */
export async function forwardToBackend(request: Request, backendPath: string, search: string, token: string | undefined): Promise<Response> {
  const base = process.env.WAMI_API_URL!.replace(/\/$/, "");
  const method = request.method.toUpperCase();
  const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": "fr" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const hasBody = method !== "GET" && method !== "HEAD";
  if (hasBody) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(`${base}${backendPath}${search}`, {
      method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
    return unwrap(res);
  } catch {
    return Response.json({ message: "Le backend WAMI ne répond pas.", code: "backend_unreachable" }, { status: 502 });
  }
}

interface Envelope {
  success?: boolean;
  data?: unknown;
  error?: { message?: string; code?: string };
  message?: string;
}

/**
 * Le backend répond `{ success, data }` ou `{ success: false, error: { message, code } }`.
 * Le navigateur reçoit directement `data`, ou `{ message, code }` en cas d'erreur
 * (c'est ce que lit `shared/lib/http.ts`).
 */
async function unwrap(res: Response): Promise<Response> {
  const text = await res.text();
  let body: Envelope | null = null;
  try {
    body = text ? (JSON.parse(text) as Envelope) : null;
  } catch {
    body = null;
  }
  if (!res.ok || body?.success === false) {
    const status = res.ok ? 400 : res.status;
    return Response.json({ message: body?.error?.message ?? body?.message ?? "Erreur du backend WAMI.", code: body?.error?.code }, { status });
  }
  if (res.status === 204 || body === null) return new Response(null, { status: res.status === 204 ? 204 : 200 });
  return Response.json(body.success === true && "data" in body ? body.data : body, { status: res.status });
}
