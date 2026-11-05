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
  "scheduled-rides",
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
  "withdrawals",
  "wallet-grants",
  "receivables",
  "wallet-config",
  "pricing-profiles",
  "users",
  "payments",
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
  "scheduled-rides": { operations: "write", support: "read" },
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
  withdrawals: { finance: "write" },
  "wallet-grants": { finance: "write", support: "read" },
  receivables: { finance: "write", operations: "read" },
  "wallet-config": { finance: "read" },
  "pricing-profiles": { operations: "read", finance: "read" },
  users: { operations: "read", support: "read" },
  payments: { finance: "read", support: "read" },
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

/**
 * Avec le vrai backend, les droits viennent de permissions (`ride.view_all`…),
 * pas des 4 rôles ci-dessus. Pour chaque module : permissions qui donnent la lecture
 * et l'écriture. Un module absent de cette table n'a pas d'équivalent backend
 * (il tourne sur le faux backend) : visible par tout agent, écriture réservée
 * à qui peut créer des admins.
 */
const PERMISSION_MAP: Partial<Record<Module, { read: string[]; write: string[] }>> = {
  rides: { read: ["ride.view_all"], write: ["ride.update_status"] },
  "scheduled-rides": { read: ["ride.scheduled.assign.view"], write: ["ride.scheduled.assign"] },
  drivers: { read: ["driver.view_all"], write: ["driver.suspend", "driver.reactivate", "driver.update_info"] },
  contracts: { read: ["contract.view_all"], write: ["contract.create", "contract.installment.manual_payment", "contract.suspend"] },
  wallet: { read: ["wallet.view_all"], write: ["wallet.block_withdrawals", "wallet.withdrawal.approve", "wallet.grant.request"] },
  withdrawals: { read: ["wallet.view_all"], write: ["wallet.withdrawal.approve", "wallet.withdrawal.reject"] },
  "wallet-grants": { read: ["wallet.grant.view"], write: ["wallet.grant.request", "wallet.grant.approve"] },
  receivables: { read: ["wallet.view_all"], write: ["wallet.view_all"] },
  "wallet-config": { read: ["wallet.config.manage"], write: ["wallet.config.manage"] },
  users: { read: ["user.view_all"], write: ["user.view_all"] },
  payments: { read: ["payment.view_all"], write: ["payment.view_all"] },
  "promo-codes": { read: ["promo.view", "promo.manage"], write: ["promo.manage"] },
  affiliate: { read: ["affiliate.view", "affiliate.manage"], write: ["affiliate.manage"] },
  "driver-bonus": { read: ["driver.view_all"], write: ["driver.welcome_bonus.manage"] },
  "pricing-zones": { read: ["pricing.grid.configure"], write: ["pricing.grid.configure"] },
  rbac: { read: ["admin.view_all"], write: ["admin.create", "admin.update_role"] },
};

export function canWithPermissions(permissions: string[], module: Module, need: Exclude<Access, "none"> = "read"): boolean {
  const entry = PERMISSION_MAP[module];
  if (!entry) return need === "read" || permissions.includes("admin.create");
  return entry[need].some((p) => permissions.includes(p));
}

/** Rôle interne le plus proche, pour les écrans encore sur le faux backend. */
export function roleFromPermissions(permissions: string[]): Role {
  if (permissions.includes("admin.create")) return "superAdmin";
  if (permissions.includes("wallet.withdrawal.approve")) return "finance";
  if (permissions.includes("ride.update_status")) return "operations";
  return "support";
}
