import "server-only";
import type { SessionUser } from "@/shared/auth/session";
import { moneyRoutes } from "./handlers/money";
import { networkRoutes } from "./handlers/network";
import { operationsRoutes } from "./handlers/operations";
import { settingsRoutes } from "./handlers/settings";
import { dispatch } from "./router";

const routes = [...operationsRoutes, ...networkRoutes, ...moneyRoutes, ...settingsRoutes];

/** Faux backend : utilisé quand `WAMI_API_URL` n'est pas défini. */
export function handleMock(method: string, path: string, query: URLSearchParams, body: Record<string, unknown>, user: SessionUser): Promise<Response> {
  return dispatch(routes, method.toUpperCase(), path, query, body, user);
}
