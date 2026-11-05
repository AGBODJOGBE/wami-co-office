import type { AuditEntry, Member, NewMember, Permission, RoleInfo } from "./rbac";

export interface RbacRepository {
  members(): Promise<Member[]>;
  roles(): Promise<RoleInfo[]>;
  permissions(): Promise<Permission[]>;
  createRole(name: string, displayName: string, description: string, permissionIds: string[]): Promise<void>;
  updateRolePermissions(roleId: string, add: string[], remove: string[]): Promise<void>;
  grantPermission(adminId: string, code: string): Promise<void>;
  register(m: NewMember): Promise<void>;
  changeRole(adminId: string, roleId: string): Promise<void>;
  deactivate(adminId: string): Promise<void>;
  reactivate(adminId: string): Promise<void>;
  /** Route absente du backend : servie par le faux backend. */
  audit(category: AuditEntry["category"] | "all"): Promise<AuditEntry[]>;
}
