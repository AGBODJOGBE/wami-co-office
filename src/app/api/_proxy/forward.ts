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
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return Response.json({ message: "Le backend WAMI ne répond pas.", code: "backend_unreachable" }, { status: 502 });
  }
}
