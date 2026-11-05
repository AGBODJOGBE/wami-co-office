import "server-only";
import { MODULES, ROLES, ROLE_LABELS, accessOf, type Role } from "@/shared/auth/permissions";
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
  // Même contrat que le backend WAMI : /api/admin/admins, /register, /roles, PATCH …/role|deactivate|reactivate.
  route("GET", `${A}/admins`, "rbac", () => {
    const admins = db().members.map((m) => {
      const [firstName = "", ...rest] = m.name.split(" ");
      return { adminId: m.id, firstName, lastName: rest.join(" "), email: m.email, phoneNumber: "+229 01 00 00 00 00", roleId: m.role, roleName: ROLE_LABELS[m.role], status: m.deactivated ? "DEACTIVATED" : "ACTIVE", createdAt: new Date().toISOString() };
    });
    return { admins, total: admins.length, page: 1, limit: 100 };
  }),
  route("GET", `${A}/roles`, "rbac", () => ({
    roles: ROLES.map((r) => ({
      id: r,
      name: r.toUpperCase(),
      displayName: ROLE_LABELS[r],
      description: null,
      isSystem: true,
      permissions: MODULES.filter((m) => accessOf(r, m) !== "none").map((m) => ({ id: `${r}-${m}`, code: `${m}.${accessOf(r, m) === "write" ? "manage" : "view"}`, name: m, module: m })),
    })),
  })),
  route("POST", `${A}/register`, "rbac", ({ body, user }) => {
    const firstName = str(body, "firstName");
    const lastName = str(body, "lastName");
    if (!firstName || !lastName || !str(body, "phone") || !str(body, "password") || !str(body, "roleId")) throw invalid("Phone, password, firstName, lastName, and roleId are required");
    const role = asRole(body.roleId);
    const m: Member = { id: newId("agent"), name: `${firstName} ${lastName}`, email: `${firstName.toLowerCase()}@wami.example`, role, lastSeenAt: null, twoFactor: false, invited: true };
    db().members.push(m);
    audit(user, "Comptes", `A créé le compte de ${m.name} (${ROLE_LABELS[role]})`);
    return { adminId: m.id, userId: m.id, roleName: ROLE_LABELS[role], message: "Admin registered" };
  }),
  route("PATCH", `${A}/admins/:id/role`, "rbac", ({ params, body, user }) => {
    const m = find(db().members, (x) => x.id === params.id);
    const role = asRole(body.roleId);
    if (m.role === "superAdmin" && role !== "superAdmin" && db().members.filter((x) => x.role === "superAdmin" && !x.deactivated).length <= 1) {
      throw new MockError(409, "Il doit rester au moins un super admin.", "last_admin");
    }
    audit(user, "Comptes", `A donné le rôle ${ROLE_LABELS[role]} à ${m.name}`);
    replace(db().members, (x) => x.id === m.id, { ...m, role });
    return { adminId: m.id, newRoleName: ROLE_LABELS[role], message: "Role changed" };
  }),
  ...(["deactivate", "reactivate"] as const).map((action) =>
    route("PATCH", `${A}/admins/:id/${action}`, "rbac", ({ params, user }) => {
      const m = find(db().members, (x) => x.id === params.id);
      if (action === "deactivate" && m.role === "superAdmin" && db().members.filter((x) => x.role === "superAdmin" && !x.deactivated).length <= 1) {
        throw new MockError(409, "Il doit rester au moins un super admin.", "last_admin");
      }
      audit(user, "Comptes", `${action === "deactivate" ? "A retiré" : "A rétabli"} l’accès de ${m.name}`);
      replace(db().members, (x) => x.id === m.id, { ...m, deactivated: action === "deactivate" });
      return { adminId: m.id, message: action };
    }),
  ),
  // Route absente du backend (faux backend) : journal d'audit.
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
