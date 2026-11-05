import "server-only";
import type { SessionUser } from "@/shared/auth/session";
import { seed, type MockDb } from "./seed";

/**
 * Base en mémoire du faux backend. Conservée sur `globalThis` pour survivre
 * au rechargement à chaud en développement ; remise à zéro au redémarrage.
 * Noms, numéros et montants : fictifs.
 */
const g = globalThis as unknown as { __wamiMockDb?: MockDb };

export function db(): MockDb {
  g.__wamiMockDb ??= seed();
  return g.__wamiMockDb;
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(++seq).toString(36)}`;

/** Trace une action dans le journal, comme le ferait le backend. */
export function audit(user: SessionUser, category: "Argent" | "Comptes" | "Réglages" | "Opérations", action: string) {
  db().audit.unshift({ id: newId("log"), at: new Date().toISOString(), actor: user.name, category, action });
}
