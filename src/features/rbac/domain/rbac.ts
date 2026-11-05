/** Équipe interne (administrateurs), rôles avec leurs permissions, et journal des actions. */

export type AdminStatus = "active" | "suspended" | "deactivated";
export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = { active: "Actif", suspended: "Suspendu", deactivated: "Désactivé" };

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  roleId: string;
  roleName: string;
  status: AdminStatus;
  createdAt: string;
}

export interface Permission {
  code: string;
  name: string;
  module: string;
}

export interface RoleInfo {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

/** Journal des actions : route absente du backend (faux backend). */
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  category: "Argent" | "Comptes" | "Réglages" | "Opérations";
  action: string;
}

export interface NewMember {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  roleId: string;
}

export function registerBlocker(m: NewMember, members: Member[]): string | null {
  if (m.firstName.trim().length < 2 || m.lastName.trim().length < 2) return "Prénom et nom obligatoires.";
  if (!/^\+?[0-9 ]{8,15}$/.test(m.phone.trim())) return "Numéro de téléphone invalide.";
  if (m.password.length < 8) return "Mot de passe : 8 caractères minimum.";
  if (!m.roleId) return "Choisissez un rôle.";
  const digits = (v: string) => v.replace(/\D/g, "");
  if (members.some((x) => digits(x.phone) === digits(m.phone))) return "Ce numéro fait déjà partie de l’équipe.";
  return null;
}

/** On ne modifie pas son propre accès (rôle, désactivation). */
export function accessChangeBlocker(member: Member, actingId: string): string | null {
  return member.id === actingId ? "Vous ne pouvez pas modifier votre propre accès." : null;
}

export function deactivateBlocker(member: Member, actingId: string): string | null {
  const own = accessChangeBlocker(member, actingId);
  if (own) return own;
  return member.status === "deactivated" ? "Ce compte est déjà désactivé." : null;
}

export function reactivateBlocker(member: Member): string | null {
  return member.status === "active" ? "Ce compte est déjà actif." : null;
}

/** Permissions regroupées par module, pour l'affichage. */
export function groupByModule(perms: Permission[]): Array<[string, Permission[]]> {
  const map = new Map<string, Permission[]>();
  for (const p of perms) map.set(p.module, [...(map.get(p.module) ?? []), p]);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}
