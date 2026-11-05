import "server-only";
import { MODULES, ROLES, ROLE_LABELS, accessOf, type Role } from "@/shared/auth/permissions";
import { audit, db, newId } from "../db";
import { find, num, replace, str } from "../helpers";
import { MockError, invalid, route, type MockRoute } from "../router";
import type { Member, PlatformSettings, Tariff } from "../seed-types";

const A = "/v1/admin";

/** Paramètres système et versions d'applications de démonstration (état en mémoire, comme le reste du faux backend). */
const mockParams: Array<{ id: string; key: string; value: string; type: string; description: string; updatedBy: string; version: number; updatedAt: string; hasSpec: boolean; forcedOutOfBounds: boolean; module: string; label: string; unit: string; displayValue: string; min?: number; max?: number }> = [
  { id: "sc-1", key: "ride.matching.radius_km", value: "5", type: "NUMBER", description: "Rayon maximal de recherche d'un chauffeur.", updatedBy: "agent-superAdmin", version: 2, updatedAt: new Date().toISOString(), hasSpec: true, forcedOutOfBounds: false, module: "Courses", label: "Rayon de recherche", unit: "km", displayValue: "5 km", min: 1, max: 15 },
  { id: "sc-2", key: "wallet.withdrawal.auto_approve_max", value: "25000", type: "NUMBER", description: "Montant en dessous duquel un retrait est approuvé automatiquement.", updatedBy: "agent-superAdmin", version: 1, updatedAt: new Date().toISOString(), hasSpec: true, forcedOutOfBounds: false, module: "Portefeuilles", label: "Retrait automatique", unit: "F", displayValue: "25 000 F", min: 0, max: 100000 },
];
const mockVersions = [
  { id: "av-1", appType: "DRIVER", platform: "ANDROID", packageId: "bj.wami.driver", latestVersion: "1.4.0", latestBuild: 42, minSupportedVersion: "1.2.0", minSupportedBuild: 30, forceUpdateAfter: null as string | null, downloadUrl: "https://play.google.com/store/apps/details?id=bj.wami.driver", releaseNotes: "Corrections et nouveau suivi GPS.", updatedAt: new Date().toISOString() },
  { id: "av-2", appType: "PASSENGER", platform: "IOS", packageId: "bj.wami.app", latestVersion: "2.1.0", latestBuild: 77, minSupportedVersion: "2.0.0", minSupportedBuild: 70, forceUpdateAfter: null as string | null, downloadUrl: "https://apps.apple.com/app/wami", releaseNotes: "", updatedAt: new Date().toISOString() },
];

/** Rôles créés en démonstration (état en mémoire, comme le reste du faux backend). */
const mockExtraRoles: Array<{ id: string; name: string; displayName: string; description: string | null; isSystem: boolean; permissions: Array<{ id: string; code: string; name: string; module: string }> }> = [];

/** Profils et zones de tarification de démonstration (état en mémoire, comme le reste du faux backend). */
const mockProfiles: Array<{ profileId: string; serviceKey: string; vehicleType: string | null; name: string; description: string | null; strategy: string; isActive: boolean; version: number; activatedAt: string | null; updatedAt: string; commissionRate: number; driverShareRate: number; components: Array<Record<string, unknown>> }> = [
  { profileId: "pp-1", serviceKey: "RIDE", vehicleType: "MOTO", name: "Course moto", description: "Tarif standard moto", strategy: "PER_KM", isActive: true, version: 3, activatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), commissionRate: 0.15, driverShareRate: 0.85, components: [{ type: "FLAT_FEE", key: "base", label: "Prise en charge", value: 300 }, { type: "PER_KM_TIER", key: "km", label: "Prix au km", tiers: [{}, {}] }, { type: "WAITING_FEE", key: "wait", label: "Attente", value: 25, freeUnits: 5 }, { type: "MINIMUM_FARE", key: "min", label: "Course minimum", minimum: 500 }] },
  { profileId: "pp-2", serviceKey: "RIDE", vehicleType: "MOTO", name: "Course moto (brouillon)", description: null, strategy: "PER_KM", isActive: false, version: 1, activatedAt: null, updatedAt: new Date().toISOString(), commissionRate: 0.12, driverShareRate: 0.88, components: [{ type: "PER_MINUTE", key: "min", label: "Prix à la minute", value: 20 }] },
];
const mockPricingZones: Array<{ zoneId: string; serviceKey: string; code: string; name: string; type: string; isActive: boolean }> = [
  { zoneId: "pz-1", serviceKey: "RIDE", code: "COTONOU", name: "Cotonou", type: "CITY", isActive: true },
  { zoneId: "pz-2", serviceKey: "RIDE", code: "CALAVI", name: "Abomey-Calavi", type: "CITY", isActive: false },
];

const asRole = (v: unknown): Role => {
  const r = ROLES.find((x) => x === v);
  if (!r) throw invalid("Rôle inconnu.");
  return r;
};

/** Tarifs et zones, rôles et journal, paramètres. */
export const settingsRoutes: MockRoute[] = [
  // ── Tarifs et zones ──
  route("GET", `${A}/pricing/zone-areas`, "pricing-zones", () => db().zones),
  // Profils et zones de tarification (contrat du backend WAMI : /api/admin/pricing/profiles|zones).
  route("GET", `${A}/pricing/profiles`, "pricing-profiles", () => mockProfiles.map((p) => ({ profileId: p.profileId, serviceKey: p.serviceKey, vehicleType: p.vehicleType, name: p.name, strategy: p.strategy, isActive: p.isActive, version: p.version, activatedAt: p.activatedAt, updatedAt: p.updatedAt }))),
  route("GET", `${A}/pricing/profiles/:id`, "pricing-profiles", ({ params }) => find(mockProfiles, (p) => p.profileId === params.id)),
  ...(["activate", "deactivate"] as const).map((action) =>
    route("POST", `${A}/pricing/profiles/:id/${action}`, "pricing-profiles", ({ params, user }) => {
      const p = find(mockProfiles, (x) => x.profileId === params.id);
      for (const x of mockProfiles) if (x.serviceKey === p.serviceKey && x.vehicleType === p.vehicleType) x.isActive = action === "activate" ? x.profileId === p.profileId : x.isActive && x.profileId !== p.profileId;
      audit(user, "Réglages", `Profil tarifaire « ${p.name} » : ${action}`);
      return { profileId: p.profileId, isActive: p.isActive };
    }),
  ),
  route("DELETE", `${A}/pricing/profiles/:id`, "pricing-profiles", ({ params, user }) => {
    const p = find(mockProfiles, (x) => x.profileId === params.id);
    if (p.isActive) throw invalid("Cannot delete an active pricing profile");
    mockProfiles.splice(mockProfiles.indexOf(p), 1);
    audit(user, "Réglages", `Profil tarifaire « ${p.name} » supprimé`);
    return { profileId: p.profileId };
  }),
  route("GET", `${A}/pricing/zones`, "pricing-profiles", () => mockPricingZones),
  route("POST", `${A}/pricing/zones`, "pricing-profiles", ({ body, user }) => {
    const code = str(body, "code").toUpperCase();
    if (mockPricingZones.some((z) => z.code === code && z.serviceKey === str(body, "serviceKey"))) throw invalid("Zone code already exists");
    const z = { zoneId: newId("pz"), serviceKey: str(body, "serviceKey"), code, name: str(body, "name"), type: str(body, "type"), isActive: true };
    mockPricingZones.push(z);
    audit(user, "Réglages", `Zone de tarification ${code} créée`);
    return { zoneId: z.zoneId };
  }),
  route("PATCH", `${A}/pricing/zones/:id`, "pricing-profiles", ({ params, body, user }) => {
    const z = find(mockPricingZones, (x) => x.zoneId === params.id);
    if (typeof body.isActive === "boolean") z.isActive = body.isActive;
    audit(user, "Réglages", `Zone ${z.code} : ${z.isActive ? "activée" : "désactivée"}`);
    return z;
  }),
  route("DELETE", `${A}/pricing/zones/:id`, "pricing-profiles", ({ params, user }) => {
    const z = find(mockPricingZones, (x) => x.zoneId === params.id);
    mockPricingZones.splice(mockPricingZones.indexOf(z), 1);
    audit(user, "Réglages", `Zone ${z.code} supprimée`);
    return { zoneId: z.zoneId };
  }),
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
    roles: [...mockExtraRoles, ...ROLES.map((r) => ({
      id: r,
      name: r === "superAdmin" ? "SUPER_ADMIN" : r.toUpperCase(),
      displayName: ROLE_LABELS[r],
      description: null,
      isSystem: true,
      permissions: MODULES.filter((m) => accessOf(r, m) !== "none").map((m) => ({ id: `${m}.${accessOf(r, m) === "write" ? "manage" : "view"}`, code: `${m}.${accessOf(r, m) === "write" ? "manage" : "view"}`, name: m, module: m })),
    }))],
  })),
  route("GET", `${A}/permissions`, "rbac", () => {
    const grouped: Record<string, Array<{ id: string; code: string; name: string; category: string }>> = {};
    for (const m of MODULES) grouped[m] = [{ id: `${m}.view`, code: `${m}.view`, name: `Voir ${m}`, category: "READ" }, { id: `${m}.manage`, code: `${m}.manage`, name: `Gérer ${m}`, category: "WRITE" }];
    return { permissions: grouped, total: MODULES.length * 2 };
  }),
  route("POST", `${A}/roles`, "rbac", ({ body, user }) => {
    const name = str(body, "name").toUpperCase();
    if (!name) throw invalid("name is required");
    if (mockExtraRoles.some((r) => r.name === name) || ROLES.some((r) => r.toUpperCase() === name)) throw invalid(`Role '${name}' already exists`);
    const ids = Array.isArray(body.permissionIds) ? body.permissionIds.filter((x): x is string => typeof x === "string") : [];
    const r = { id: name, name, displayName: str(body, "displayName"), description: str(body, "description"), isSystem: false, permissions: ids.map((id) => ({ id, code: id, name: id, module: id.split(".")[0] ?? "" })) };
    mockExtraRoles.push(r);
    audit(user, "Comptes", `Rôle ${name} créé`);
    return { id: r.id, name, displayName: r.displayName, description: r.description, permissionIds: ids, isSystem: false, isActive: true, createdAt: new Date().toISOString() };
  }),
  route("PATCH", `${A}/roles/:id/permissions`, "rbac", ({ params, body, user }) => {
    const add = Array.isArray(body.add) ? body.add.filter((x): x is string => typeof x === "string") : [];
    const remove = Array.isArray(body.remove) ? body.remove.filter((x): x is string => typeof x === "string") : [];
    if (add.length === 0 && remove.length === 0) throw invalid("At least one permission code must be provided in add or remove");
    if (params.id === "superAdmin" && remove.length) throw new MockError(409, "Cannot remove permissions from SUPER_ADMIN role", "conflict");
    const r = mockExtraRoles.find((x) => x.id === params.id);
    if (r) {
      r.permissions = [...r.permissions.filter((p) => !remove.includes(p.code)), ...add.map((c) => ({ id: c, code: c, name: c, module: c.split(".")[0] ?? "" }))];
    }
    audit(user, "Comptes", `Permissions du rôle ${params.id} modifiées`);
    return { roleId: params.id, roleName: params.id, added: add, removed: remove, totalPermissions: r?.permissions.length ?? 0 };
  }),
  route("POST", `${A}/admins/:id/grant-permission`, "rbac", ({ params, body, user }) => {
    const m = find(db().members, (x) => x.id === params.id);
    const code = str(body, "permissionCode");
    if (!code) throw invalid("permissionCode is required");
    audit(user, "Comptes", `Permission ${code} accordée à ${m.name}`);
    return { adminId: m.id, permissionCode: code, message: "Permission granted" };
  }),
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

  // Paramètres système et versions des applications (contrat du backend WAMI : /api/app-config…, hors préfixe /admin).
  route("GET", "/v1/app-config/config", "system-config", () => mockParams),
  route("PUT", "/v1/app-config/config/:key", "system-config", ({ params, body, user }) => {
    if (user.role !== "superAdmin") throw new MockError(403, "Super admin requis.", "forbidden");
    const p = find(mockParams, (x) => x.key === params.key);
    const value = str(body, "value");
    const n = Number(value);
    const outside = (p.min !== undefined && n < p.min) || (p.max !== undefined && n > p.max);
    if (outside && body.force !== true) throw invalid(`La valeur est hors bornes (${p.min}–${p.max}).`);
    if (outside && str(body, "justification").trim().length < 10) throw invalid("justification requise pour forcer.");
    Object.assign(p, { value, displayValue: `${value}${p.unit ? ` ${p.unit}` : ""}`, version: p.version + 1, updatedAt: new Date().toISOString(), forcedOutOfBounds: outside });
    audit(user, "Réglages", `Paramètre ${p.key} : ${value}${outside ? " (forcé)" : ""}`);
    return { id: p.id, key: p.key, value, type: p.type, version: p.version, withinBounds: !outside, forcedOutOfBounds: outside };
  }),
  route("GET", "/v1/app-config", "system-config", () => mockVersions),
  route("PUT", "/v1/app-config/:appType/:platform", "system-config", ({ params, body, user }) => {
    const v = find(mockVersions, (x) => x.appType === params.appType && x.platform === params.platform);
    if (!/^\d+\.\d+\.\d+$/.test(str(body, "latestVersion"))) throw invalid("latestVersion invalide");
    Object.assign(v, { latestVersion: str(body, "latestVersion"), latestBuild: num(body, "latestBuild"), minSupportedVersion: str(body, "minSupportedVersion"), minSupportedBuild: num(body, "minSupportedBuild"), forceUpdateAfter: typeof body.forceUpdateAfter === "string" ? body.forceUpdateAfter : null, downloadUrl: str(body, "downloadUrl"), releaseNotes: str(body, "releaseNotes"), updatedAt: new Date().toISOString() });
    audit(user, "Réglages", `Versions ${params.appType} ${params.platform} mises à jour`);
    return v;
  }),

  // ── Paramètres ──
  route("GET", `${A}/settings`, "settings", () => db().settings),
  route("PUT", `${A}/settings`, "settings", ({ body, user }) => {
    db().settings = body as unknown as PlatformSettings;
    audit(user, "Réglages", "A modifié les paramètres de la plateforme");
    return db().settings;
  }),
];
