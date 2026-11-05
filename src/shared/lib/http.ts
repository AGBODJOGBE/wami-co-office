import { ApiError } from "./result";

/**
 * Client HTTP du navigateur. Tous les appels passent par le proxy Next
 * (`/api/v1/...` → `app/api/v1/[...path]` → `app/api/_proxy`), jamais
 * directement vers le backend : le jeton reste dans un cookie httpOnly.
 */
type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(route: string, query?: Query): string {
  const url = `/api${route}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(method: string, route: string, body?: unknown, query?: Query): Promise<T> {
  const res = await fetch(buildUrl(route, query), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const payload = (data ?? {}) as { message?: string; code?: string };
    throw new ApiError(res.status, payload.message ?? "", payload.code);
  }
  return data as T;
}

export const http = {
  get: <T>(route: string, query?: Query) => request<T>("GET", route, undefined, query),
  post: <T>(route: string, body?: unknown) => request<T>("POST", route, body ?? {}),
  put: <T>(route: string, body?: unknown) => request<T>("PUT", route, body ?? {}),
  patch: <T>(route: string, body?: unknown) => request<T>("PATCH", route, body ?? {}),
  delete: <T>(route: string) => request<T>("DELETE", route),
};
