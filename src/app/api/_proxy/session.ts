import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/shared/auth/session";

/**
 * Cookie de session signé (HMAC-SHA256). Contient l'agent et, avec un vrai
 * backend, son jeton d'accès. Le cookie est httpOnly : le navigateur ne lit
 * jamais le jeton.
 *
 * À valider : durée de session, rotation du jeton (refresh), et secret
 * `SESSION_SECRET` obligatoire en production.
 */
export interface SessionPayload {
  user: SessionUser;
  token?: string;
  exp: number;
}

export const SESSION_TTL_SECONDS = 60 * 60 * 10; // une journée de travail

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && process.env.WAMI_API_URL) {
    throw new Error("SESSION_SECRET (32 caractères minimum) est obligatoire en production.");
  }
  return "wami-dev-secret-ne-pas-utiliser-en-production";
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [data, mac] = value.split(".");
  if (!data || !mac) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}
