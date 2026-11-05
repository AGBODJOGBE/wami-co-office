import "server-only";
import { ROLES, ROLE_LABELS, type Role } from "@/shared/auth/permissions";
import { audit, db, newId } from "../db";
import { find, replace, str } from "../helpers";
import { MockError, invalid, route, type MockRoute } from "../router";
import type { Member, PlatformSettings, Tariff } from "../seed-types";

const A = "/v1/admin";

const asRole = (v: unknown): Role => {
  const r = ROLES.find((x) => x === v);
  if (!r) throw invalid("Rôle inconnu.");
  return r;
};

/** Tarifs et zones, rôles et journal, paramètres. */
export const settingsRoutes: MockRoute[] = [
  // ── Tarifs et zones ──
  route("GET", `${A}/pricing/zones`, "pricing-zones", () => db().zones),
  route("GET", `${A}/pricing/zones/:zoneId/tariffs`, "pricing-zones", ({ params }) => db().tariffs[params.zoneId!] ?? []),
  route("PUT", `${A}/pricing/zones/:zoneId/tariffs/:service`, "pricing-zones", ({ params, body, user }) => {
    const list = db().tariffs[params.zoneId!];
    if (!list) throw invalid("Zone inconnue.");
    const before = find(list, (t) => t.service === params.service);
    const next: Tariff = { ...(body as unknown as Tariff), service: before.service, updatedAt: new Date().toISOString(), updatedBy: user.name };
    audit(user, "Réglages", `Tarif ${before.label} (${params.zoneId}) : par km ${before.perKm} F → ${next.perKm} F, minimum ${before.minimum} F → ${next.minimum} F`);
    return replace(list, (t) => t.service === before.service, next);
  }),
  route("GET", `${A}/pricing/commissions`, "pricing-zones", () => db().commissions),

  // ── Rôles et journal ──
  route("GET", `${A}/rbac/members`, "rbac", () => db().members),
  route("POST", `${A}/rbac/members`, "rbac", ({ body, user }) => {
    const email = str(body, "email").toLowerCase();
    if (db().members.some((m) => m.email === email)) throw invalid("Déjà dans l’équipe.");
    const m: Member = { id: newId("agent"), name: str(body, "name"), email, role: asRole(body.role), lastSeenAt: null, twoFactor: false, invited: true };
    db().members.push(m);
    audit(user, "Comptes", `A invité ${m.name} (${ROLE_LABELS[m.role]})`);
    return m;
  }),
  route("PATCH", `${A}/rbac/members/:id`, "rbac", ({ params, body, user }) => {
    const m = find(db().members, (x) => x.id === params.id);
    const role = asRole(body.role);
    if (m.role === "superAdmin" && role !== "superAdmin" && db().members.filter((x) => x.role === "superAdmin").length <= 1) {
      throw new MockError(409, "Il doit rester au moins un super admin.", "last_admin");
    }
    audit(user, "Comptes", `A donné le rôle ${ROLE_LABELS[role]} à ${m.name}`);
    return replace(db().members, (x) => x.id === m.id, { ...m, role });
  }),
  route("DELETE", `${A}/rbac/members/:id`, "rbac", ({ params, user }) => {
    const m = find(db().members, (x) => x.id === params.id);
    db().members = db().members.filter((x) => x.id !== m.id);
    audit(user, "Comptes", `A retiré l’accès de ${m.name}`);
    return { ok: true };
  }),
  route("GET", `${A}/rbac/audit-log`, "rbac", ({ query }) => {
    const category = query.get("category");
    return db().audit.filter((a) => !category || a.category === category);
  }),

  // ── Paramètres ──
  route("GET", `${A}/settings`, "settings", () => db().settings),
  route("PUT", `${A}/settings`, "settings", ({ body, user }) => {
    db().settings = body as unknown as PlatformSettings;
    audit(user, "Réglages", "A modifié les paramètres de la plateforme");
    return db().settings;
  }),
];
