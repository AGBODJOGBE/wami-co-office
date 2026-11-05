/**
 * Rôles internes et matrice d'accès par module.
 * La matrice est la valeur par défaut ; la feature `rbac` permet de la consulter
 * et d'attribuer les rôles. Le backend reste seul juge (403 si refus).
 */
export const ROLES = ["superAdmin", "operations", "support", "finance"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  superAdmin: "Super admin",
  operations: "Opérations",
  support: "Support et vérification",
  finance: "Finance",
};

export const MODULES = [
  "dashboard",
  "search",
  "live-ops",
  "rides",
  "delivery",
  "delivery-b2b",
  "rounds",
  "vtc",
  "parcel-types",
  "documents",
  "drivers",
  "vehicles",
  "contracts",
  "driver-bonus",
  "establishments",
  "support",
  "wallet",
  "finance",
  "promo-codes",
  "affiliate",
  "referrals",
  "notifications",
  "pricing-zones",
  "rbac",
  "settings",
] as const;
export type Module = (typeof MODULES)[number];

export type Access = "none" | "read" | "write";

type Row = Partial<Record<Role, Access>>;

/** Absent = aucun accès. Super admin : écriture partout. */
const MATRIX: Record<Module, Row> = {
  dashboard: { operations: "read", support: "read", finance: "read" },
  search: { operations: "read", support: "read", finance: "read" },
  "live-ops": { operations: "write", support: "read" },
  rides: { operations: "write", support: "write", finance: "read" },
  delivery: { operations: "write", support: "write", finance: "read" },
  "delivery-b2b": { operations: "read", support: "read", finance: "write" },
  rounds: { operations: "write" },
  vtc: { operations: "read" },
  "parcel-types": { operations: "read" },
  documents: { support: "write" },
  drivers: { operations: "read", support: "write", finance: "read" },
  vehicles: { operations: "write", finance: "read" },
  contracts: { operations: "read", finance: "write" },
  "driver-bonus": { operations: "write", finance: "read" },
  establishments: { operations: "read", support: "write", finance: "read" },
  support: { operations: "read", support: "write" },
  wallet: { support: "read", finance: "write" },
  finance: { finance: "write" },
  "promo-codes": { finance: "read" },
  affiliate: { finance: "write" },
  referrals: { support: "read", finance: "read" },
  notifications: { operations: "write", support: "read" },
  "pricing-zones": { operations: "read", finance: "read" },
  rbac: {},
  settings: {},
};

export function accessOf(role: Role, module: Module): Access {
  if (role === "superAdmin") return "write";
  return MATRIX[module][role] ?? "none";
}

export function can(role: Role | undefined, module: Module, need: Exclude<Access, "none"> = "read"): boolean {
  if (!role) return false;
  const a = accessOf(role, module);
  return need === "read" ? a !== "none" : a === "write";
}
